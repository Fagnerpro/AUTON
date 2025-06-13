from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import structlog
import math

from app.models.simulation import Simulation, SimulationType, SimulationStatus
from app.schemas.simulation import (
    SimulationCreate, 
    SimulationUpdate, 
    SimulationCalculateRequest,
    SimulationCalculateResponse
)
from app.core.config import settings

logger = structlog.get_logger()

class SimulationService:
    """Serviço para operações de simulação."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get(self, simulation_id: int) -> Optional[Simulation]:
        """Obter simulação por ID."""
        return self.db.query(Simulation).filter(Simulation.id == simulation_id).first()
    
    async def get_user_simulations(
        self, 
        user_id: int,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Simulation]:
        """Obter simulações do usuário."""
        return (
            self.db.query(Simulation)
            .filter(Simulation.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    async def create(
        self, 
        simulation_data: SimulationCreate, 
        user_id: int,
        organization_id: Optional[int] = None
    ) -> Simulation:
        """Criar nova simulação."""
        
        db_simulation = Simulation(
            name=simulation_data.name,
            description=simulation_data.description,
            type=simulation_data.type,
            user_id=user_id,
            organization_id=organization_id,
            address=simulation_data.address,
            city=simulation_data.city,
            state=simulation_data.state,
            latitude=simulation_data.latitude,
            longitude=simulation_data.longitude,
            input_parameters=simulation_data.input_parameters,
            status=SimulationStatus.DRAFT,
            solar_radiation=settings.DEFAULT_SOLAR_RADIATION,
            system_efficiency=settings.DEFAULT_SYSTEM_EFFICIENCY,
            panel_power=settings.DEFAULT_PANEL_POWER,
            panel_area=settings.DEFAULT_PANEL_AREA
        )
        
        self.db.add(db_simulation)
        self.db.commit()
        self.db.refresh(db_simulation)
        
        logger.info("Simulação criada", simulation_id=db_simulation.id, user_id=user_id)
        
        return db_simulation
    
    async def update(
        self, 
        simulation_id: int, 
        simulation_data: SimulationUpdate
    ) -> Optional[Simulation]:
        """Atualizar simulação."""
        
        db_simulation = await self.get(simulation_id)
        
        if not db_simulation:
            return None
        
        update_data = simulation_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_simulation, field, value)
        
        db_simulation.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_simulation)
        
        logger.info("Simulação atualizada", simulation_id=simulation_id)
        
        return db_simulation
    
    async def delete(self, simulation_id: int) -> bool:
        """Deletar simulação."""
        
        db_simulation = await self.get(simulation_id)
        
        if not db_simulation:
            return False
        
        self.db.delete(db_simulation)
        self.db.commit()
        
        logger.info("Simulação deletada", simulation_id=simulation_id)
        
        return True
    
    async def calculate(
        self, 
        calculation_data: SimulationCalculateRequest
    ) -> SimulationCalculateResponse:
        """Calcular simulação solar."""
        
        simulation_type = calculation_data.type
        params = calculation_data.input_parameters
        
        if simulation_type == SimulationType.RESIDENTIAL:
            results = await self._calculate_residential(params)
        elif simulation_type == SimulationType.EV_CHARGING:
            results = await self._calculate_ev_charging(params)
        elif simulation_type == SimulationType.COMMON_AREAS:
            results = await self._calculate_common_areas(params)
        elif simulation_type == SimulationType.COMMERCIAL:
            results = await self._calculate_commercial(params)
        elif simulation_type == SimulationType.INDUSTRIAL:
            results = await self._calculate_industrial(params)
        else:
            raise ValueError(f"Tipo de simulação não suportado: {simulation_type}")
        
        return SimulationCalculateResponse(
            type=simulation_type,
            results=results["results"],
            technical_specs=results["technical_specs"],
            financial_analysis=results["financial_analysis"],
            recommendations=results.get("recommendations")
        )
    
    async def calculate_and_save(self, simulation_id: int) -> Optional[Simulation]:
        """Calcular e salvar resultados da simulação."""
        
        db_simulation = await self.get(simulation_id)
        
        if not db_simulation:
            return None
        
        # Preparar dados para cálculo
        calculation_data = SimulationCalculateRequest(
            type=db_simulation.type,
            input_parameters=db_simulation.input_parameters
        )
        
        # Calcular resultados
        calculation_results = await self.calculate(calculation_data)
        
        # Salvar resultados na simulação
        db_simulation.results = calculation_results.results
        db_simulation.total_investment = calculation_results.financial_analysis.get("total_investment")
        db_simulation.annual_savings = calculation_results.financial_analysis.get("annual_savings")
        db_simulation.payback_years = calculation_results.financial_analysis.get("payback_years")
        db_simulation.roi_percentage = calculation_results.financial_analysis.get("roi_percentage")
        db_simulation.status = SimulationStatus.COMPLETED
        db_simulation.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_simulation)
        
        logger.info("Simulação calculada e salva", simulation_id=simulation_id)
        
        return db_simulation
    
    async def _calculate_residential(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calcular simulação residencial."""
        
        num_units = params["num_units"]
        consumption_per_unit = params["consumption_per_unit"]  # kWh/mês
        available_area = params["available_area"]  # m²
        
        # Cálculos técnicos
        total_consumption = num_units * consumption_per_unit * 12  # kWh/ano
        daily_consumption = total_consumption / 365  # kWh/dia
        
        # Dimensionamento do sistema
        required_generation = daily_consumption / settings.DEFAULT_SOLAR_RADIATION
        required_power = required_generation * 1000  # Wp
        num_panels = math.ceil(required_power / settings.DEFAULT_PANEL_POWER)
        required_area = num_panels * settings.DEFAULT_PANEL_AREA
        
        # Verificar se área é suficiente
        area_sufficient = required_area <= available_area
        
        if not area_sufficient:
            # Ajustar para área disponível
            max_panels = int(available_area / settings.DEFAULT_PANEL_AREA)
            num_panels = max_panels
            required_power = num_panels * settings.DEFAULT_PANEL_POWER
            required_area = num_panels * settings.DEFAULT_PANEL_AREA
            annual_generation = (required_power / 1000) * settings.DEFAULT_SOLAR_RADIATION * 365
        else:
            annual_generation = total_consumption
        
        # Análise financeira
        cost_per_wp = 4.5  # R$/Wp (estimativa 2024)
        total_investment = required_power * cost_per_wp
        annual_savings = annual_generation * 0.65  # R$ (tarifa média)
        payback_years = total_investment / annual_savings if annual_savings > 0 else 0
        roi_percentage = (annual_savings / total_investment) * 100 if total_investment > 0 else 0
        
        return {
            "results": {
                "num_panels": num_panels,
                "total_power": required_power,
                "required_area": required_area,
                "annual_generation": annual_generation,
                "coverage_percentage": (annual_generation / total_consumption) * 100,
                "area_sufficient": area_sufficient
            },
            "technical_specs": {
                "panel_power": settings.DEFAULT_PANEL_POWER,
                "panel_area": settings.DEFAULT_PANEL_AREA,
                "system_efficiency": settings.DEFAULT_SYSTEM_EFFICIENCY,
                "solar_radiation": settings.DEFAULT_SOLAR_RADIATION
            },
            "financial_analysis": {
                "total_investment": total_investment,
                "annual_savings": annual_savings,
                "payback_years": payback_years,
                "roi_percentage": roi_percentage,
                "cost_per_wp": cost_per_wp
            }
        }
    
    async def _calculate_ev_charging(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calcular simulação para recarga de veículos elétricos."""
        
        num_parking_spots = params["num_parking_spots"]
        charging_points_percentage = params["charging_points_percentage"] / 100
        energy_per_charge = params.get("energy_per_charge", 18)  # kWh
        charges_per_day = params.get("charges_per_day", 1)
        
        # Cálculos técnicos
        num_charging_points = int(num_parking_spots * charging_points_percentage)
        daily_consumption = num_charging_points * energy_per_charge * charges_per_day
        annual_consumption = daily_consumption * 365
        
        # Dimensionamento do sistema
        required_generation = daily_consumption / settings.DEFAULT_SOLAR_RADIATION
        required_power = required_generation * 1000  # Wp
        num_panels = math.ceil(required_power / settings.DEFAULT_PANEL_POWER)
        required_area = num_panels * settings.DEFAULT_PANEL_AREA
        
        # Sistema de armazenamento (para recarga noturna)
        battery_capacity = daily_consumption * 1.2  # 20% de margem
        battery_cost = battery_capacity * 800  # R$/kWh
        
        # Análise financeira
        cost_per_wp = 4.5  # R$/Wp
        system_cost = required_power * cost_per_wp
        total_investment = system_cost + battery_cost
        
        # Receita estimada (cobrança por recarga)
        price_per_kwh = 0.80  # R$/kWh
        annual_revenue = annual_consumption * price_per_kwh
        annual_savings = annual_revenue - (annual_consumption * 0.65)  # Economia vs. rede
        
        payback_years = total_investment / annual_savings if annual_savings > 0 else 0
        roi_percentage = (annual_savings / total_investment) * 100 if total_investment > 0 else 0
        
        return {
            "results": {
                "num_charging_points": num_charging_points,
                "num_panels": num_panels,
                "total_power": required_power,
                "required_area": required_area,
                "daily_consumption": daily_consumption,
                "annual_consumption": annual_consumption,
                "battery_capacity": battery_capacity
            },
            "technical_specs": {
                "panel_power": settings.DEFAULT_PANEL_POWER,
                "panel_area": settings.DEFAULT_PANEL_AREA,
                "system_efficiency": settings.DEFAULT_SYSTEM_EFFICIENCY,
                "solar_radiation": settings.DEFAULT_SOLAR_RADIATION,
                "energy_per_charge": energy_per_charge
            },
            "financial_analysis": {
                "system_cost": system_cost,
                "battery_cost": battery_cost,
                "total_investment": total_investment,
                "annual_revenue": annual_revenue,
                "annual_savings": annual_savings,
                "payback_years": payback_years,
                "roi_percentage": roi_percentage
            }
        }
    
    async def _calculate_common_areas(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calcular simulação para áreas comuns."""
        
        daily_consumption = params["daily_consumption"]  # kWh/dia
        critical_consumption_per_hour = params["critical_consumption_per_hour"]  # kWh/h
        backup_hours = params.get("backup_hours", 8)  # horas de autonomia
        
        # Cálculos técnicos
        annual_consumption = daily_consumption * 365
        
        # Dimensionamento do sistema
        required_generation = daily_consumption / settings.DEFAULT_SOLAR_RADIATION
        required_power = required_generation * 1000  # Wp
        num_panels = math.ceil(required_power / settings.DEFAULT_PANEL_POWER)
        required_area = num_panels * settings.DEFAULT_PANEL_AREA
        
        # Sistema de backup
        backup_capacity = critical_consumption_per_hour * backup_hours
        battery_cost = backup_capacity * 800  # R$/kWh
        
        # Análise financeira
        cost_per_wp = 4.5  # R$/Wp
        system_cost = required_power * cost_per_wp
        total_investment = system_cost + battery_cost
        annual_savings = annual_consumption * 0.65  # R$ (tarifa média)
        
        payback_years = total_investment / annual_savings if annual_savings > 0 else 0
        roi_percentage = (annual_savings / total_investment) * 100 if total_investment > 0 else 0
        
        return {
            "results": {
                "num_panels": num_panels,
                "total_power": required_power,
                "required_area": required_area,
                "annual_consumption": annual_consumption,
                "backup_capacity": backup_capacity,
                "backup_hours": backup_hours
            },
            "technical_specs": {
                "panel_power": settings.DEFAULT_PANEL_POWER,
                "panel_area": settings.DEFAULT_PANEL_AREA,
                "system_efficiency": settings.DEFAULT_SYSTEM_EFFICIENCY,
                "solar_radiation": settings.DEFAULT_SOLAR_RADIATION
            },
            "financial_analysis": {
                "system_cost": system_cost,
                "battery_cost": battery_cost,
                "total_investment": total_investment,
                "annual_savings": annual_savings,
                "payback_years": payback_years,
                "roi_percentage": roi_percentage
            }
        }
    
    async def _calculate_commercial(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calcular simulação comercial."""
        monthly_consumption = params["monthly_consumption"]  # kWh/mês
        available_area = params["available_area"]  # m²
        
        return await self._calculate_basic_system(monthly_consumption, available_area)
    
    async def _calculate_industrial(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Calcular simulação industrial."""
        monthly_consumption = params["monthly_consumption"]  # kWh/mês
        available_area = params["available_area"]  # m²
        
        return await self._calculate_basic_system(monthly_consumption, available_area)
    
    async def _calculate_basic_system(
        self, 
        monthly_consumption: float, 
        available_area: float
    ) -> Dict[str, Any]:
        """Calcular sistema básico (comercial/industrial)."""
        
        # Cálculos técnicos
        annual_consumption = monthly_consumption * 12
        daily_consumption = annual_consumption / 365
        
        # Dimensionamento do sistema
        required_generation = daily_consumption / settings.DEFAULT_SOLAR_RADIATION
        required_power = required_generation * 1000  # Wp
        num_panels = math.ceil(required_power / settings.DEFAULT_PANEL_POWER)
        required_area = num_panels * settings.DEFAULT_PANEL_AREA
        
        # Verificar se área é suficiente
        area_sufficient = required_area <= available_area
        
        if not area_sufficient:
            # Ajustar para área disponível
            max_panels = int(available_area / settings.DEFAULT_PANEL_AREA)
            num_panels = max_panels
            required_power = num_panels * settings.DEFAULT_PANEL_POWER
            required_area = num_panels * settings.DEFAULT_PANEL_AREA
            annual_generation = (required_power / 1000) * settings.DEFAULT_SOLAR_RADIATION * 365
        else:
            annual_generation = annual_consumption
        
        # Análise financeira
        cost_per_wp = 4.0  # R$/Wp (menor para sistemas grandes)
        total_investment = required_power * cost_per_wp
        annual_savings = annual_generation * 0.65  # R$ (tarifa média)
        payback_years = total_investment / annual_savings if annual_savings > 0 else 0
        roi_percentage = (annual_savings / total_investment) * 100 if total_investment > 0 else 0
        
        return {
            "results": {
                "num_panels": num_panels,
                "total_power": required_power,
                "required_area": required_area,
                "annual_generation": annual_generation,
                "coverage_percentage": (annual_generation / annual_consumption) * 100,
                "area_sufficient": area_sufficient
            },
            "technical_specs": {
                "panel_power": settings.DEFAULT_PANEL_POWER,
                "panel_area": settings.DEFAULT_PANEL_AREA,
                "system_efficiency": settings.DEFAULT_SYSTEM_EFFICIENCY,
                "solar_radiation": settings.DEFAULT_SOLAR_RADIATION
            },
            "financial_analysis": {
                "total_investment": total_investment,
                "annual_savings": annual_savings,
                "payback_years": payback_years,
                "roi_percentage": roi_percentage,
                "cost_per_wp": cost_per_wp
            }
        }

