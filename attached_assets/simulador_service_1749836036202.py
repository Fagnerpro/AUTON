def calcular_geracao(consumo_kwh: float) -> float:
    """
    Calcula estimativa de geração solar com base no consumo informado.
    """
    fator_geracao = 1.2  # Exemplo de fator fixo
    return consumo_kwh * fator_geracao
