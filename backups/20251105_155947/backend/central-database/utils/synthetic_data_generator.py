#!/usr/bin/env python3
"""
Auxeira Synthetic Data Generator
Generates realistic synthetic data for all 7 dashboard types with proper timestamping
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import numpy as np
from faker import Faker

fake = Faker()

@dataclass
class SyntheticDataConfig:
    """Configuration for synthetic data generation"""
    user_type: str
    data_type: str
    count: int
    time_range_days: int = 30
    variance: float = 0.2
    trend: str = "stable"  # "improving", "declining", "stable", "volatile"
    seed: Optional[int] = None

class SyntheticDataGenerator:
    """Main class for generating synthetic data across all dashboard types"""
    
    def __init__(self, seed: Optional[int] = None):
        if seed:
            random.seed(seed)
            np.random.seed(seed)
            fake.seed_instance(seed)
        
        self.timestamp = datetime.now()
        
        # Define realistic ranges for different metrics
        self.metric_ranges = {
            "startup_founder": {
                "sse_score": (45, 95),
                "revenue": (0, 500000),
                "customers": (0, 1000),
                "team_size": (1, 50),
                "burn_rate": (5000, 100000),
                "runway_months": (3, 24),
                "interviews_completed": (0, 20),
                "tokens_earned": (0, 5000)
            },
            "venture_capital": {
                "portfolio_size": (10, 100),
                "total_aum": (10000000, 1000000000),
                "active_deals": (5, 50),
                "deal_flow_monthly": (20, 200),
                "portfolio_valuation": (50000000, 5000000000),
                "exits_ytd": (0, 10)
            },
            "angel_investor": {
                "investments_count": (5, 50),
                "total_invested": (100000, 5000000),
                "active_investments": (3, 30),
                "exits": (0, 8),
                "portfolio_irr": (-0.2, 0.8),
                "check_size_avg": (10000, 250000)
            },
            "corporate_partner": {
                "active_partnerships": (5, 100),
                "partnership_value": (100000, 10000000),
                "startups_engaged": (10, 500),
                "benefits_redeemed": (50, 2000),
                "roi_partnerships": (1.2, 5.0),
                "pilot_programs": (2, 20)
            },
            "government": {
                "startups_monitored": (100, 5000),
                "grants_distributed": (10, 500),
                "jobs_created": (500, 50000),
                "economic_impact": (1000000, 500000000),
                "compliance_rate": (0.7, 0.98),
                "innovation_index": (60, 95)
            },
            "esg_funder": {
                "esg_score_avg": (60, 90),
                "carbon_reduction": (0.1, 0.5),
                "social_impact_score": (50, 95),
                "governance_score": (65, 95),
                "sustainable_investments": (5, 100),
                "impact_measurement": (0.6, 0.95)
            },
            "impact_investor": {
                "social_roi": (1.5, 8.0),
                "lives_impacted": (1000, 1000000),
                "sdg_alignment": (0.7, 0.95),
                "impact_investments": (10, 200),
                "beneficiaries": (500, 500000),
                "impact_score": (70, 95)
            }
        }
    
    def generate_timestamp_series(self, count: int, days: int) -> List[datetime]:
        """Generate a series of timestamps over a given period"""
        start_date = self.timestamp - timedelta(days=days)
        timestamps = []
        
        for i in range(count):
            # Create more realistic timestamp distribution (more recent data)
            progress = i / (count - 1) if count > 1 else 0
            # Bias towards more recent timestamps
            time_offset = days * (progress ** 1.5)
            timestamp = start_date + timedelta(days=time_offset)
            timestamps.append(timestamp)
        
        return timestamps
    
    def apply_trend(self, base_value: float, progress: float, trend: str, variance: float) -> float:
        """Apply trend and variance to a base value"""
        # Apply trend
        if trend == "improving":
            trend_factor = 1 + (progress * 0.3)  # Up to 30% improvement
        elif trend == "declining":
            trend_factor = 1 - (progress * 0.2)  # Up to 20% decline
        elif trend == "volatile":
            trend_factor = 1 + np.sin(progress * 4 * np.pi) * 0.15  # Oscillating
        else:  # stable
            trend_factor = 1 + (random.random() - 0.5) * 0.05  # Small random variation
        
        # Apply variance
        variance_factor = 1 + (random.random() - 0.5) * variance * 2
        
        return base_value * trend_factor * variance_factor
    
    def generate_startup_founder_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for startup founder dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["startup_founder"]
        
        # Base values for consistency
        base_sse = random.randint(ranges["sse_score"][0], ranges["sse_score"][1])
        base_revenue = random.randint(ranges["revenue"][0], ranges["revenue"][1])
        base_customers = random.randint(ranges["customers"][0], ranges["customers"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            # Generate correlated metrics
            sse_score = max(0, min(100, int(self.apply_trend(base_sse, progress, config.trend, config.variance))))
            revenue = max(0, int(self.apply_trend(base_revenue, progress, config.trend, config.variance)))
            customers = max(0, int(self.apply_trend(base_customers, progress, config.trend, config.variance)))
            
            # Derived metrics
            team_size = max(1, int(base_customers / 50) + random.randint(1, 5))
            burn_rate = max(1000, int(revenue * 0.8 + random.randint(5000, 20000)))
            runway_months = max(1, int((revenue * 6) / burn_rate)) if burn_rate > 0 else 12
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "startup_founder",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "trend_based_v1",
                "metrics": {
                    "sse_score": sse_score,
                    "revenue": revenue,
                    "customers": customers,
                    "team_size": team_size,
                    "burn_rate": burn_rate,
                    "runway_months": runway_months,
                    "interviews_completed": random.randint(0, 5),
                    "tokens_earned": random.randint(50, 500),
                    "profile_completion": min(100, max(60, sse_score + random.randint(-10, 10))),
                    "actions_this_week": random.randint(0, 8),
                    "streak_days": random.randint(0, 30)
                }
            })
        
        return data
    
    def generate_venture_capital_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for venture capital dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["venture_capital"]
        
        base_portfolio = random.randint(ranges["portfolio_size"][0], ranges["portfolio_size"][1])
        base_aum = random.randint(ranges["total_aum"][0], ranges["total_aum"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            portfolio_size = max(1, int(self.apply_trend(base_portfolio, progress, "improving", 0.1)))
            total_aum = max(1000000, int(self.apply_trend(base_aum, progress, config.trend, config.variance)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "venture_capital",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "portfolio_simulation_v1",
                "metrics": {
                    "portfolio_size": portfolio_size,
                    "total_aum": total_aum,
                    "active_deals": random.randint(5, 20),
                    "deal_flow_monthly": random.randint(20, 100),
                    "portfolio_valuation": int(total_aum * random.uniform(1.2, 3.0)),
                    "exits_ytd": random.randint(0, 5),
                    "avg_sse_score": random.randint(65, 85),
                    "high_performers": random.randint(5, 15),
                    "at_risk_companies": random.randint(1, 8),
                    "new_investments": random.randint(2, 10)
                }
            })
        
        return data
    
    def generate_angel_investor_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for angel investor dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["angel_investor"]
        
        base_investments = random.randint(ranges["investments_count"][0], ranges["investments_count"][1])
        base_total_invested = random.randint(ranges["total_invested"][0], ranges["total_invested"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            investments_count = max(1, int(self.apply_trend(base_investments, progress, "improving", 0.15)))
            total_invested = max(10000, int(self.apply_trend(base_total_invested, progress, config.trend, config.variance)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "angel_investor",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "angel_portfolio_v1",
                "metrics": {
                    "investments_count": investments_count,
                    "total_invested": total_invested,
                    "active_investments": max(1, investments_count - random.randint(0, 5)),
                    "exits": random.randint(0, max(1, investments_count // 5)),
                    "portfolio_irr": round(random.uniform(-0.1, 0.6), 3),
                    "check_size_avg": int(total_invested / investments_count) if investments_count > 0 else 25000,
                    "due_diligence_active": random.randint(1, 5),
                    "syndicate_deals": random.randint(0, 8),
                    "follow_on_opportunities": random.randint(2, 10)
                }
            })
        
        return data
    
    def generate_corporate_partner_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for corporate partner dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["corporate_partner"]
        
        base_partnerships = random.randint(ranges["active_partnerships"][0], ranges["active_partnerships"][1])
        base_value = random.randint(ranges["partnership_value"][0], ranges["partnership_value"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            active_partnerships = max(1, int(self.apply_trend(base_partnerships, progress, config.trend, 0.2)))
            partnership_value = max(50000, int(self.apply_trend(base_value, progress, config.trend, config.variance)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "corporate_partner",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "partnership_metrics_v1",
                "metrics": {
                    "active_partnerships": active_partnerships,
                    "partnership_value": partnership_value,
                    "startups_engaged": random.randint(20, 200),
                    "benefits_redeemed": random.randint(100, 1000),
                    "roi_partnerships": round(random.uniform(1.5, 4.0), 2),
                    "pilot_programs": random.randint(3, 15),
                    "innovation_projects": random.randint(5, 25),
                    "cost_savings": random.randint(100000, 2000000),
                    "new_applications": random.randint(10, 50)
                }
            })
        
        return data
    
    def generate_government_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for government dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["government"]
        
        base_startups = random.randint(ranges["startups_monitored"][0], ranges["startups_monitored"][1])
        base_impact = random.randint(ranges["economic_impact"][0], ranges["economic_impact"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            startups_monitored = max(50, int(self.apply_trend(base_startups, progress, "improving", 0.1)))
            economic_impact = max(500000, int(self.apply_trend(base_impact, progress, config.trend, config.variance)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "government",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "ecosystem_metrics_v1",
                "metrics": {
                    "startups_monitored": startups_monitored,
                    "grants_distributed": random.randint(20, 200),
                    "jobs_created": random.randint(1000, 20000),
                    "economic_impact": economic_impact,
                    "compliance_rate": round(random.uniform(0.8, 0.95), 3),
                    "innovation_index": random.randint(70, 90),
                    "regional_growth": round(random.uniform(0.02, 0.08), 3),
                    "startup_survival_rate": round(random.uniform(0.6, 0.8), 3),
                    "policy_effectiveness": round(random.uniform(0.7, 0.9), 3)
                }
            })
        
        return data
    
    def generate_esg_funder_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for ESG funder dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["esg_funder"]
        
        base_esg_score = random.randint(ranges["esg_score_avg"][0], ranges["esg_score_avg"][1])
        base_investments = random.randint(ranges["sustainable_investments"][0], ranges["sustainable_investments"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            esg_score_avg = max(50, min(100, int(self.apply_trend(base_esg_score, progress, "improving", 0.1))))
            sustainable_investments = max(1, int(self.apply_trend(base_investments, progress, config.trend, 0.15)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "esg_funder",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "esg_scoring_v1",
                "metrics": {
                    "esg_score_avg": esg_score_avg,
                    "carbon_reduction": round(random.uniform(0.1, 0.4), 3),
                    "social_impact_score": random.randint(60, 90),
                    "governance_score": random.randint(70, 95),
                    "sustainable_investments": sustainable_investments,
                    "impact_measurement": round(random.uniform(0.7, 0.95), 3),
                    "environmental_score": random.randint(65, 90),
                    "certification_rate": round(random.uniform(0.6, 0.85), 3),
                    "sustainability_trend": round(random.uniform(0.05, 0.15), 3)
                }
            })
        
        return data
    
    def generate_impact_investor_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Generate synthetic data for impact investor dashboard"""
        data = []
        timestamps = self.generate_timestamp_series(config.count, config.time_range_days)
        ranges = self.metric_ranges["impact_investor"]
        
        base_social_roi = random.uniform(ranges["social_roi"][0], ranges["social_roi"][1])
        base_lives_impacted = random.randint(ranges["lives_impacted"][0], ranges["lives_impacted"][1])
        
        for i, timestamp in enumerate(timestamps):
            progress = i / (len(timestamps) - 1) if len(timestamps) > 1 else 0
            
            social_roi = max(1.0, self.apply_trend(base_social_roi, progress, config.trend, 0.2))
            lives_impacted = max(100, int(self.apply_trend(base_lives_impacted, progress, "improving", 0.3)))
            
            data.append({
                "metric_id": str(uuid.uuid4()),
                "dashboard_type": "impact_investor",
                "metric_timestamp": timestamp.isoformat(),
                "is_synthetic": True,
                "synthetic_algorithm": "impact_measurement_v1",
                "metrics": {
                    "social_roi": round(social_roi, 2),
                    "lives_impacted": lives_impacted,
                    "sdg_alignment": round(random.uniform(0.75, 0.95), 3),
                    "impact_investments": random.randint(15, 100),
                    "beneficiaries": random.randint(1000, 100000),
                    "impact_score": random.randint(75, 95),
                    "community_development": round(random.uniform(0.6, 0.9), 3),
                    "social_progress": round(random.uniform(0.05, 0.2), 3),
                    "outcome_achievement": round(random.uniform(0.7, 0.9), 3)
                }
            })
        
        return data
    
    def generate_data(self, config: SyntheticDataConfig) -> List[Dict[str, Any]]:
        """Main method to generate synthetic data based on user type"""
        generators = {
            "startup_founder": self.generate_startup_founder_data,
            "venture_capital": self.generate_venture_capital_data,
            "angel_investor": self.generate_angel_investor_data,
            "corporate_partner": self.generate_corporate_partner_data,
            "government": self.generate_government_data,
            "esg_funder": self.generate_esg_funder_data,
            "impact_investor": self.generate_impact_investor_data
        }
        
        if config.user_type not in generators:
            raise ValueError(f"Unsupported user type: {config.user_type}")
        
        return generators[config.user_type](config)
    
    def generate_batch_data(self, configs: List[SyntheticDataConfig]) -> Dict[str, List[Dict[str, Any]]]:
        """Generate data for multiple configurations"""
        results = {}
        
        for config in configs:
            key = f"{config.user_type}_{config.data_type}"
            results[key] = self.generate_data(config)
        
        return results
    
    def export_to_json(self, data: Dict[str, List[Dict[str, Any]]], filename: str):
        """Export generated data to JSON file"""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def export_to_sql_inserts(self, data: List[Dict[str, Any]], table_name: str = "dashboard_metrics") -> str:
        """Generate SQL INSERT statements for the data"""
        if not data:
            return ""
        
        sql_statements = []
        
        for record in data:
            values = {
                'metric_id': f"'{record['metric_id']}'",
                'dashboard_type': f"'{record['dashboard_type']}'",
                'metric_name': "'synthetic_metrics'",
                'metric_value': f"'{json.dumps(record['metrics'])}'",
                'metric_timestamp': f"'{record['metric_timestamp']}'",
                'is_synthetic': str(record['is_synthetic']).lower(),
                'synthetic_algorithm': f"'{record['synthetic_algorithm']}'"
            }
            
            columns = ', '.join(values.keys())
            values_str = ', '.join(values.values())
            
            sql_statements.append(f"INSERT INTO {table_name} ({columns}) VALUES ({values_str});")
        
        return '\n'.join(sql_statements)

def main():
    """Example usage of the synthetic data generator"""
    generator = SyntheticDataGenerator(seed=42)
    
    # Generate data for all dashboard types
    configs = [
        SyntheticDataConfig("startup_founder", "metrics", 30, 30, 0.2, "improving"),
        SyntheticDataConfig("venture_capital", "portfolio", 20, 30, 0.15, "stable"),
        SyntheticDataConfig("angel_investor", "investments", 25, 30, 0.25, "improving"),
        SyntheticDataConfig("corporate_partner", "partnerships", 15, 30, 0.2, "stable"),
        SyntheticDataConfig("government", "ecosystem", 10, 30, 0.1, "improving"),
        SyntheticDataConfig("esg_funder", "sustainability", 20, 30, 0.15, "improving"),
        SyntheticDataConfig("impact_investor", "impact", 18, 30, 0.2, "improving")
    ]
    
    # Generate all data
    all_data = generator.generate_batch_data(configs)
    
    # Export to JSON
    generator.export_to_json(all_data, "synthetic_dashboard_data.json")
    
    # Generate SQL inserts for each type
    for key, data in all_data.items():
        sql_content = generator.export_to_sql_inserts(data)
        with open(f"synthetic_data_{key}.sql", 'w') as f:
            f.write(sql_content)
    
    print(f"Generated synthetic data for {len(all_data)} dashboard types")
    print(f"Total records: {sum(len(data) for data in all_data.values())}")

if __name__ == "__main__":
    main()
