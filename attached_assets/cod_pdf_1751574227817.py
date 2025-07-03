import streamlit as st
import math
import plotly.express as px
import pandas as pd
import tempfile
import io
import os
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as ReportLabImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

st.set_page_config(page_title="AUTON® USINA I.A. - Simulador Solar Integrado", layout="wide")
st.title("🔆 AUTON® USINA I.A. - Simulador Solar para Empreendimentos Sustentáveis")
st.markdown("""
Simulador integrado para dimensionamento de energia solar em Goiânia, GO, com foco em recarga de veículos elétricos, 
áreas comuns e unidades residenciais. Projetado para construtoras, prefeituras e engenheiros, em conformidade com 
ABNT NBR 16274 e NBR 5410. Gera relatórios profissionais para tomada de decisão.
""")

# Função para salvar gráficos como imagem
def save_plotly_fig(fig):
    try:
        img_bytes = fig.to_image(format="png")
        img = Image.open(io.BytesIO(img_bytes))
        return img
    except Exception as e:
        st.error(f"Erro ao salvar o gráfico: {str(e)}")
        return None

# Estado persistente
if "params" not in st.session_state:
    st.session_state.params = {
        "rad_solar": 5.5,
        "eficiência_sistema": 80,
        "custo_wp": 9.50,
        "custo_inversor_wp": 1.50,
        "custo_bateria_kwh": 3200.0,
        "tarifa_kwh": 0.74593,
        "cub_go": 2600.0,
        # Parâmetros para VE
        "potencia_painel_ve_wp": 550,
        "area_por_painel_ve_m2": 2.1,
        "area_ve_m2": 350.0,
        "num_vagas": 80,
        "percentual_com_ponto": 21,
        "consumo_kwh_recarga": 18.0,
        "capacidade_bateria_ve_kwh": 50.0,
        # Parâmetros para Áreas Comuns
        "potencia_painel_comum_wp": 550,
        "area_por_painel_comum_m2": 2.1,
        "area_comum_m2": 350.0,
        "consumo_comum_kwh_dia": 70.0,
        "consumo_critico_kwh": 4.56,
        "capacidade_bateria_comum_kwh": 50.0,
        # Parâmetros para Unidades Residenciais
        "potencia_painel_unidades_wp": 550,
        "area_por_painel_unidades_m2": 2.1,
        "area_unidades_m2": 168.0,
        "total_unidades": 80,
        "unidades_face_norte": 40,
        "paineis_por_unidade": 2,
        "valor_plus_unitario": 15000.0,
        # Área total
        "area_total_m2": 12000.0,
        # Ativação dos módulos
        "ativar_ve": True,
        "ativar_comum": True,
        "ativar_unidades": True
    }

# Parâmetros globais
with st.sidebar:
    st.header("⚙️ Parâmetros Gerais")
    area_total_m2 = st.number_input(
        "Área total do empreendimento (m²)",
        min_value=100.0,
        value=st.session_state.params["area_total_m2"],
        key="area_total_m2"
    )
    st.session_state.params["area_total_m2"] = area_total_m2

    rad_solar = st.number_input(
        "Radiação solar média (kWh/m²/dia)",
        min_value=1.0,
        value=st.session_state.params["rad_solar"],
        help="Goiânia: ~5,5 kWh/m²/dia",
        key="rad_solar"
    )
    st.session_state.params["rad_solar"] = rad_solar

    eficiência_sistema = st.slider(
        "Eficiência do sistema (%)",
        50,
        90,
        st.session_state.params["eficiência_sistema"],
        key="eficiência_sistema"
    )
    st.session_state.params["eficiência_sistema"] = eficiência_sistema

    custo_wp = st.number_input(
        "Custo por Wp (painéis) (R$)",
        min_value=1.0,
        value=st.session_state.params["custo_wp"],
        key="custo_wp"
    )
    st.session_state.params["custo_wp"] = custo_wp

    custo_inversor_wp = st.number_input(
        "Custo por Wp (inversores) (R$)",
        min_value=0.0,
        value=st.session_state.params["custo_inversor_wp"],
        key="custo_inversor_wp"
    )
    st.session_state.params["custo_inversor_wp"] = custo_inversor_wp

    custo_bateria_kwh = st.number_input(
        "Custo por kWh de bateria (R$)",
        min_value=0.0,
        value=st.session_state.params["custo_bateria_kwh"],
        key="custo_bateria_kwh"
    )
    st.session_state.params["custo_bateria_kwh"] = custo_bateria_kwh

    tarifa_kwh = st.number_input(
        "Tarifa elétrica (R$/kWh)",
        min_value=0.1,
        value=st.session_state.params["tarifa_kwh"],
        key="tarifa_kwh"
    )
    st.session_state.params["tarifa_kwh"] = tarifa_kwh

    cub_go = st.number_input(
        "CUB Goiás (R$/m²)",
        min_value=500.0,
        value=st.session_state.params["cub_go"],
        key="cub_go"
    )
    st.session_state.params["cub_go"] = cub_go

    # Parâmetros dos painéis para VE
    st.subheader("Painéis para Recarga de VE")
    potencia_painel_ve_wp = st.number_input(
        "Potência do painel solar (VE) (Wp)",
        min_value=100,
        value=st.session_state.params["potencia_painel_ve_wp"],
        key="potencia_painel_ve_wp"
    )
    st.session_state.params["potencia_painel_ve_wp"] = potencia_painel_ve_wp

    area_por_painel_ve_m2 = st.number_input(
        "Área por painel (VE) (m²)",
        min_value=0.1,
        value=st.session_state.params["area_por_painel_ve_m2"],
        key="area_por_painel_ve_m2"
    )
    st.session_state.params["area_por_painel_ve_m2"] = area_por_painel_ve_m2

    # Parâmetros dos painéis para Áreas Comuns
    st.subheader("Painéis para Áreas Comuns")
    potencia_painel_comum_wp = st.number_input(
        "Potência do painel solar (Comum) (Wp)",
        min_value=100,
        value=st.session_state.params["potencia_painel_comum_wp"],
        key="potencia_painel_comum_wp"
    )
    st.session_state.params["potencia_painel_comum_wp"] = potencia_painel_comum_wp

    area_por_painel_comum_m2 = st.number_input(
        "Área por painel (Comum) (m²)",
        min_value=0.1,
        value=st.session_state.params["area_por_painel_comum_m2"],
        key="area_por_painel_comum_m2"
    )
    st.session_state.params["area_por_painel_comum_m2"] = area_por_painel_comum_m2

    # Parâmetros dos painéis para Unidades Residenciais
    st.subheader("Painéis para Unidades Residenciais")
    potencia_painel_unidades_wp = st.number_input(
        "Potência do painel solar (Unidades) (Wp)",
        min_value=100,
        value=st.session_state.params["potencia_painel_unidades_wp"],
        key="potencia_painel_unidades_wp"
    )
    st.session_state.params["potencia_painel_unidades_wp"] = potencia_painel_unidades_wp

    area_por_painel_unidades_m2 = st.number_input(
        "Área por painel (Unidades) (m²)",
        min_value=0.1,
        value=st.session_state.params["area_por_painel_unidades_m2"],
        key="area_por_painel_unidades_m2"
    )
    st.session_state.params["area_por_painel_unidades_m2"] = area_por_painel_unidades_m2

# Seleção de módulos
st.header("📌 Seleção de Módulos")
st.markdown("Escolha quais módulos deseja incluir na simulação:")
col1, col2, col3 = st.columns(3)
with col1:
    ativar_ve = st.checkbox("Ativar Recarga de VE", value=st.session_state.params["ativar_ve"], key="ativar_ve")
    st.session_state.params["ativar_ve"] = ativar_ve
with col2:
    ativar_comum = st.checkbox("Ativar Áreas Comuns", value=st.session_state.params["ativar_comum"], key="ativar_comum")
    st.session_state.params["ativar_comum"] = ativar_comum
with col3:
    ativar_unidades = st.checkbox("Ativar Unidades Residenciais", value=st.session_state.params["ativar_unidades"], key="ativar_unidades")
    st.session_state.params["ativar_unidades"] = ativar_unidades

# Valores padrão para evitar NameError
area_ve_m2 = st.session_state.params["area_ve_m2"] if ativar_ve else 0
area_comum_m2 = st.session_state.params["area_comum_m2"] if ativar_comum else 0
area_unidades_m2 = st.session_state.params["area_unidades_m2"] if ativar_unidades else 0
num_paineis_ve = 0
num_paineis_comum = 0
num_paineis_unidades = 0
pontos_recarga = 0
demanda_ve_kwh_dia = 0
consumo_comum_kwh_dia = 0
consumo_critico_kwh = 0
capacidade_bateria_ve_kwh = 0
capacidade_bateria_comum_kwh = 0
autonomia_horas = 0
unidades_face_norte = 0
paineis_por_unidade = 0
valor_plus_unitario = 0
valor_agregado_total = 0

# Abas para diferentes módulos
tab1, tab2, tab3 = st.tabs(["Recarga de VE", "Áreas Comuns", "Unidades Residenciais"])

# Estado para erros
if "errors" not in st.session_state:
    st.session_state.errors = {}

# Tab 1: Recarga de VE
with tab1:
    if not ativar_ve:
        st.info("Módulo 'Recarga de VE' desativado. Ative-o na seção 'Seleção de Módulos' para configurar.")
    else:
        st.subheader("🔋 Dimensionamento para Recarga de Veículos Elétricos")
        area_ve_m2 = st.number_input(
            "Área disponível para painéis (VE) (m²)",
            min_value=0.0,
            value=st.session_state.params["area_ve_m2"],
            key="area_ve_m2"
        )
        st.session_state.params["area_ve_m2"] = area_ve_m2

        num_vagas = st.number_input(
            "Número total de vagas",
            min_value=1,
            value=st.session_state.params["num_vagas"],
            key="num_vagas"
        )
        st.session_state.params["num_vagas"] = num_vagas

        percentual_com_ponto = st.slider(
            "% de vagas com ponto de recarga",
            0,
            100,
            st.session_state.params["percentual_com_ponto"],
            key="percentual_com_ponto"
        )
        st.session_state.params["percentual_com_ponto"] = percentual_com_ponto

        consumo_kwh_recarga = st.number_input(
            "Consumo por recarga (kWh)",
            min_value=1.0,
            value=st.session_state.params["consumo_kwh_recarga"],
            key="consumo_kwh_recarga"
        )
        st.session_state.params["consumo_kwh_recarga"] = consumo_kwh_recarga

        capacidade_bateria_ve_kwh = st.number_input(
            "Capacidade de armazenamento (VE) (kWh)",
            min_value=0.0,
            value=st.session_state.params["capacidade_bateria_ve_kwh"],
            key="capacidade_bateria_ve_kwh"
        )
        st.session_state.params["capacidade_bateria_ve_kwh"] = capacidade_bateria_ve_kwh

        # Cálculos para VE
        energia_por_painel_ve = (potencia_painel_ve_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
        pontos_recarga = math.ceil(num_vagas * (percentual_com_ponto / 100))
        demanda_ve_kwh_dia = pontos_recarga * consumo_kwh_recarga
        num_paineis_ve = math.ceil(demanda_ve_kwh_dia / energia_por_painel_ve) if energia_por_painel_ve > 0 else 0
        area_necessaria_ve = num_paineis_ve * area_por_painel_ve_m2

        if area_necessaria_ve > area_ve_m2:
            st.session_state.errors["ve_area"] = f"Erro: Área insuficiente ({area_ve_m2} m²). Necessário: {area_necessaria_ve:.2f} m²."
            st.error(st.session_state.errors["ve_area"])
        else:
            st.session_state.errors.pop("ve_area", None)

# Tab 2: Áreas Comuns
with tab2:
    if not ativar_comum:
        st.info("Módulo 'Áreas Comuns' desativado. Ative-o na seção 'Seleção de Módulos' para configurar.")
    else:
        st.subheader("🏛️ Dimensionamento para Áreas Comuns")
        if "ve_area" in st.session_state.errors:
            st.warning("Corrija os erros na aba 'Recarga de VE' para prosseguir com os cálculos.")
        else:
            area_comum_m2 = st.number_input(
                "Área disponível para painéis (comum) (m²)",
                min_value=0.0,
                value=st.session_state.params["area_comum_m2"],
                key="area_comum_m2"
            )
            st.session_state.params["area_comum_m2"] = area_comum_m2

            consumo_comum_kwh_dia = st.number_input(
                "Consumo das áreas comuns (kWh/dia)",
                min_value=0.0,
                value=st.session_state.params["consumo_comum_kwh_dia"],
                key="consumo_comum_kwh_dia"
            )
            st.session_state.params["consumo_comum_kwh_dia"] = consumo_comum_kwh_dia

            consumo_critico_kwh = st.number_input(
                "Consumo crítico (kWh/h)",
                min_value=0.0,
                value=st.session_state.params["consumo_critico_kwh"],
                help="Elevadores, iluminação, portaria",
                key="consumo_critico_kwh"
            )
            st.session_state.params["consumo_critico_kwh"] = consumo_critico_kwh

            capacidade_bateria_comum_kwh = st.number_input(
                "Capacidade de armazenamento (Comum) (kWh)",
                min_value=0.0,
                value=st.session_state.params["capacidade_bateria_comum_kwh"],
                key="capacidade_bateria_comum_kwh"
            )
            st.session_state.params["capacidade_bateria_comum_kwh"] = capacidade_bateria_comum_kwh

            # Cálculos para Áreas Comuns
            energia_por_painel_comum = (potencia_painel_comum_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
            num_paineis_comum = math.ceil(consumo_comum_kwh_dia / energia_por_painel_comum) if energia_por_painel_comum > 0 else 0
            area_necessaria_comum = num_paineis_comum * area_por_painel_comum_m2
            if area_necessaria_comum > area_comum_m2:
                st.session_state.errors["comum_area"] = f"Erro: Área insuficiente ({area_comum_m2} m²). Necessário: {area_necessaria_comum:.2f} m²."
                st.error(st.session_state.errors["comum_area"])
            else:
                st.session_state.errors.pop("comum_area", None)
            autonomia_horas = capacidade_bateria_comum_kwh / consumo_critico_kwh if consumo_critico_kwh > 0 else 0

# Tab 3: Unidades Residenciais
with tab3:
    if not ativar_unidades:
        st.info("Módulo 'Unidades Residenciais' desativado. Ative-o na seção 'Seleção de Módulos' para configurar.")
    else:
        st.subheader("🏠 Dimensionamento para Unidades Residenciais")
        if "ve_area" in st.session_state.errors or "comum_area" in st.session_state.errors:
            st.warning("Corrija os erros nas abas anteriores para prosseguir com os cálculos.")
        else:
            area_unidades_m2 = st.number_input(
                "Área disponível para painéis (unidades) (m²)",
                min_value=0.0,
                value=st.session_state.params["area_unidades_m2"],
                key="area_unidades_m2"
            )
            st.session_state.params["area_unidades_m2"] = area_unidades_m2

            total_unidades = st.number_input(
                "Total de unidades",
                min_value=1,
                value=st.session_state.params["total_unidades"],
                key="total_unidades"
            )
            st.session_state.params["total_unidades"] = total_unidades

            unidades_face_norte = st.number_input(
                "Unidades com face norte",
                min_value=0,
                max_value=total_unidades,
                value=st.session_state.params["unidades_face_norte"],
                key="unidades_face_norte"
            )
            st.session_state.params["unidades_face_norte"] = unidades_face_norte

            paineis_por_unidade = st.number_input(
                "Painéis por unidade",
                min_value=1,
                value=st.session_state.params["paineis_por_unidade"],
                key="paineis_por_unidade"
            )
            st.session_state.params["paineis_por_unidade"] = paineis_por_unidade

            valor_plus_unitario = st.number_input(
                "Valorização por unidade (R$)",
                min_value=0.0,
                value=st.session_state.params["valor_plus_unitario"],
                key="valor_plus_unitario"
            )
            st.session_state.params["valor_plus_unitario"] = valor_plus_unitario

            # Cálculos para Unidades Residenciais
            energia_por_painel_unidades = (potencia_painel_unidades_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
            num_paineis_unidades = unidades_face_norte * paineis_por_unidade
            area_necessaria_unidades = num_paineis_unidades * area_por_painel_unidades_m2
            if area_necessaria_unidades > area_unidades_m2:
                st.session_state.errors["unidades_area"] = f"Erro: Área insuficiente ({area_unidades_m2} m²). Necessário: {area_necessaria_unidades:.2f} m²."
                st.error(st.session_state.errors["unidades_area"])
            else:
                st.session_state.errors.pop("unidades_area", None)
            valor_agregado_total = unidades_face_norte * valor_plus_unitario

# Validação da área total
total_area_alocada = area_ve_m2 + area_comum_m2 + area_unidades_m2
if total_area_alocada > area_total_m2:
    st.session_state.errors["total_area"] = f"Erro: Soma das áreas alocadas ({total_area_alocada:.2f} m²) excede a área total do empreendimento ({area_total_m2:.2f} m²)."
    st.error(st.session_state.errors["total_area"])
else:
    st.session_state.errors.pop("total_area", None)

# Cálculos integrados e resultados
st.info("Após alterar os valores, clique em 'Aplicar Simulação' para atualizar os resultados e gerar um novo PDF.")
if st.button("▶️ Aplicar Simulação"):
    if st.session_state.errors:
        st.error("Corrija os erros abaixo antes de prosseguir:")
        for error in st.session_state.errors.values():
            st.write(f"- {error}")
    elif not (ativar_ve or ativar_comum or ativar_unidades):
        st.error("Selecione pelo menos um módulo para simular.")
    else:
        with st.spinner("Calculando..."):
            # Inicializar variáveis
            capacidade_total_kwp = 0
            geracao_total_kwh_dia = 0
            num_paineis_total = 0
            capacidade_total_baterias_kwh = 0

            # Ajustar cálculos com base nos módulos ativados
            if ativar_ve:
                energia_por_painel_ve = (potencia_painel_ve_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
                capacidade_ve_kwp = (num_paineis_ve * potencia_painel_ve_wp) / 1000
                geracao_ve_kwh_dia = num_paineis_ve * energia_por_painel_ve
                capacidade_total_kwp += capacidade_ve_kwp
                geracao_total_kwh_dia += geracao_ve_kwh_dia
                num_paineis_total += num_paineis_ve
                capacidade_total_baterias_kwh += capacidade_bateria_ve_kwh
            else:
                num_paineis_ve = 0
                pontos_recarga = 0
                demanda_ve_kwh_dia = 0
                capacidade_bateria_ve_kwh = 0

            if ativar_comum:
                energia_por_painel_comum = (potencia_painel_comum_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
                capacidade_comum_kwp = (num_paineis_comum * potencia_painel_comum_wp) / 1000
                geracao_comum_kwh_dia = num_paineis_comum * energia_por_painel_comum
                capacidade_total_kwp += capacidade_comum_kwp
                geracao_total_kwh_dia += geracao_comum_kwh_dia
                num_paineis_total += num_paineis_comum
                capacidade_total_baterias_kwh += capacidade_bateria_comum_kwh
            else:
                num_paineis_comum = 0
                consumo_comum_kwh_dia = 0
                consumo_critico_kwh = 0
                capacidade_bateria_comum_kwh = 0
                autonomia_horas = 0

            if ativar_unidades:
                energia_por_painel_unidades = (potencia_painel_unidades_wp / 1000) * rad_solar * (eficiência_sistema / 100) * 0.90
                capacidade_unidades_kwp = (num_paineis_unidades * potencia_painel_unidades_wp) / 1000
                geracao_unidades_kwh_dia = num_paineis_unidades * energia_por_painel_unidades
                capacidade_total_kwp += capacidade_unidades_kwp
                geracao_total_kwh_dia += geracao_unidades_kwh_dia
                num_paineis_total += num_paineis_unidades
            else:
                num_paineis_unidades = 0
                unidades_face_norte = 0
                paineis_por_unidade = 0
                valor_agregado_total = 0

            # Cálculos financeiros
            custo_paineis = capacidade_total_kwp * 1000 * custo_wp
            custo_inversores = capacidade_total_kwp * 1000 * custo_inversor_wp
            custo_instalacao = custo_paineis * 0.10 + 10000.0  # 10% + custo fixo
            custo_baterias = capacidade_total_baterias_kwh * custo_bateria_kwh
            custo_total = custo_paineis + custo_inversores + custo_instalacao + custo_baterias
            economia_anual = geracao_total_kwh_dia * 365 * tarifa_kwh
            payback_anos = custo_total / economia_anual if economia_anual > 0 else float('inf')

            st.header("📊 Resultados Integrados")
            st.write(f"**Total de painéis:** {num_paineis_total}")
            st.write(f"**Capacidade total de baterias:** {capacidade_total_baterias_kwh:.2f} kWh")
            st.write(f"**Geração diária:** {geracao_total_kwh_dia:.2f} kWh/dia")
            st.write(f"**Capacidade total:** {capacidade_total_kwp:.2f} kWp")
            st.write(f"**Custo total:** R$ {custo_total:,.2f}")
            st.write(f"**Economia anual:** R$ {economia_anual:,.2f}")
            st.write(f"**Payback:** {payback_anos:.2f} anos")

            if payback_anos < 2 or payback_anos > 20:
                st.warning("Aviso: Payback fora do intervalo esperado (2-20 anos). Verifique os parâmetros.")

            # Gráfico de distribuição (apenas para módulos ativados)
            setores = []
            num_paineis = []
            cores = []
            if ativar_ve:
                setores.append("VE")
                num_paineis.append(num_paineis_ve)
                cores.append("#2ca02c")
            if ativar_comum:
                setores.append("Áreas Comuns")
                num_paineis.append(num_paineis_comum)
                cores.append("#ff7f0e")
            if ativar_unidades:
                setores.append("Unidades")
                num_paineis.append(num_paineis_unidades)
                cores.append("#1f77b4")

            if setores:
                fig = px.bar(
                    x=setores,
                    y=num_paineis,
                    title="Distribuição de Painéis Solares",
                    labels={"x": "Setor", "y": "Número de Painéis"},
                    color=setores,
                    color_discrete_sequence=cores
                )
                st.plotly_chart(fig)
            else:
                st.warning("Nenhum módulo ativado para exibir o gráfico.")

            # Geração de PDF
            with st.spinner("Gerando PDF..."):
                tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
                doc = SimpleDocTemplate(tmp.name, pagesize=A4)
                styles = getSampleStyleSheet()
                elements = []

                # Capa
                elements.append(Paragraph("Relatório AUTON® USINA I.A.", styles['Title']))
                elements.append(Spacer(1, 12))
                elements.append(Paragraph("Simulação Solar para Empreendimentos Sustentáveis - Goiânia, GO", styles['Normal']))
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(
                    f"Economia anual: R$ {economia_anual:,.2f} | Payback: {payback_anos:.2f} anos | Capacidade: {capacidade_total_kwp:.2f} kWp",
                    styles['Normal']
                ))
                elements.append(Spacer(1, 24))

                # Gráfico
                if setores:
                    img = save_plotly_fig(fig)
                    if img:
                        img_path = tempfile.NamedTemporaryFile(delete=False, suffix=".png").name
                        img.save(img_path)
                        elements.append(ReportLabImage(img_path, width=400, height=200))
                    else:
                        st.warning("Gráfico não incluído no PDF devido a um erro.")

                # Tabela de resultados
                resultados = [["Parâmetro", "Valor"]]
                if ativar_ve:
                    resultados.extend([
                        ["Área disponível para VE", f"{area_ve_m2:.2f} m²"],
                        ["Pontos de recarga VE", f"{pontos_recarga}"],
                        ["Demanda diária VE", f"{demanda_ve_kwh_dia:.2f} kWh"],
                        ["Painéis para VE", f"{num_paineis_ve}"],
                        ["Capacidade de bateria (VE)", f"{capacidade_bateria_ve_kwh:.2f} kWh"]
                    ])
                if ativar_comum:
                    resultados.extend([
                        ["Consumo áreas comuns", f"{consumo_comum_kwh_dia:.2f} kWh/dia"],
                        ["Painéis áreas comuns", f"{num_paineis_comum}"],
                        ["Capacidade de bateria (Comum)", f"{capacidade_bateria_comum_kwh:.2f} kWh"]
                    ])
                if ativar_unidades:
                    resultados.extend([
                        ["Unidades face norte", f"{unidades_face_norte}"],
                        ["Painéis por unidade", f"{paineis_por_unidade}"],
                        ["Valor agregado total", f"R$ {valor_agregado_total:,.2f}"]
                    ])
                resultados.extend([
                    ["Total de painéis", f"{num_paineis_total}"],
                    ["Capacidade total de baterias", f"{capacidade_total_baterias_kwh:.2f} kWh"],
                    ["Geração diária", f"{geracao_total_kwh_dia:.2f} kWh/dia"],
                    ["Capacidade total", f"{capacidade_total_kwp:.2f} kWp"],
                    ["Custo total", f"R$ {custo_total:,.2f}"],
                    ["Economia anual", f"R$ {economia_anual:,.2f}"],
                    ["Payback", f"{payback_anos:.2f} anos"]
                ])
                table = Table(resultados)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(table)

                # Nota de conformidade
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(
                    "Nota: Dimensionamento em conformidade com ABNT NBR 16274 e NBR 5410.",
                    styles['Normal']
                ))

                try:
                    doc.build(elements)
                    with open(tmp.name, "rb") as f:
                        pdf_data = f.read()
                    st.download_button(
                        label="📥 Baixar Relatório PDF",
                        data=pdf_data,
                        file_name="relatorio_auton_usinaia.pdf",
                        mime="application/pdf"
                    )

                    # Exportação em CSV
                    df = pd.DataFrame(resultados, columns=["Parâmetro", "Valor"])
                    csv_data = df.to_csv(index=False)
                    st.download_button(
                        label="📊 Baixar Resultados em CSV",
                        data=csv_data,
                        file_name="resultados_auton_usinaia.csv",
                        mime="text/csv"
                    )
                except Exception as e:
                    st.error(f"Erro ao gerar o PDF: {str(e)}")

st.caption("Desenvolvido por USINA I.A. - Goiânia, GO")