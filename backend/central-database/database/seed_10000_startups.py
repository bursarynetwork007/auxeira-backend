#!/usr/bin/env python3
"""
Seed 10,000 Startup Profiles with Timestamped Data
Generates realistic startup data with 365-day rolling feed and 5-year history
"""

import psycopg2
import random
import json
from datetime import datetime, timedelta
from faker import Faker
import numpy as np

fake = Faker()

# Database connection (update with your credentials)
DB_CONFIG = {
    'host': 'localhost',
    'database': 'auxeira_db',
    'user': 'postgres',
    'password': 'your_password'
}

# Configuration
NUM_STARTUPS = 10000
ACTIVITIES_PER_STARTUP_MIN = 10
ACTIVITIES_PER_STARTUP_MAX = 100
METRICS_POINTS_PER_STARTUP = 52  # Weekly data points for a year

# Industries and Sectors
INDUSTRIES = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'SaaS', 'Biotech', 'CleanTech', 'AgriTech', 'FinTech',
    'EdTech', 'HealthTech', 'PropTech', 'FoodTech', 'Logistics',
    'AI/ML', 'Blockchain', 'Cybersecurity', 'IoT', 'Robotics'
]

STAGES = ['seed', 'early', 'growth', 'scale']

COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Singapore', 'India', 'Australia', 'Netherlands', 'Sweden']

ACTIVITY_TYPES = [
    'Customer Interviews', 'Product Launch', 'Funding Round', 'Partnership',
    'Market Research', 'Team Expansion', 'Revenue Milestone', 'User Growth',
    'Product Update', 'Marketing Campaign', 'Strategic Planning', 'Compliance',
    'Technology Integration', 'Customer Acquisition', 'Retention Improvement'
]

def generate_company_name():
    """Generate realistic company names"""
    prefixes = ['Tech', 'Smart', 'Cloud', 'Data', 'AI', 'Quantum', 'Cyber', 'Digital', 'Eco', 'Bio']
    suffixes = ['Labs', 'Systems', 'Solutions', 'Technologies', 'Innovations', 'Ventures', 'Platform', 'Hub', 'Network', 'Group']
    
    if random.random() < 0.3:
        return f"{fake.company().split()[0]}{random.choice(suffixes)}"
    else:
        return f"{random.choice(prefixes)}{random.choice(suffixes)}"

def generate_sse_score(stage):
    """Generate SSE score based on stage"""
    base_scores = {
        'seed': (30, 50),
        'early': (45, 65),
        'growth': (60, 80),
        'scale': (70, 95)
    }
    min_score, max_score = base_scores[stage]
    return random.randint(min_score, max_score)

def generate_financial_metrics(stage, sse_score):
    """Generate realistic financial metrics"""
    stage_multipliers = {
        'seed': 1,
        'early': 5,
        'growth': 20,
        'scale': 100
    }
    
    multiplier = stage_multipliers[stage]
    score_factor = sse_score / 100
    
    mrr = random.randint(1000, 50000) * multiplier * score_factor
    arr = mrr * 12
    revenue = arr * random.uniform(0.8, 1.2)
    growth_rate = random.uniform(5, 50) * score_factor
    burn_rate = mrr * random.uniform(0.3, 0.8)
    runway_months = int((mrr * 6) / burn_rate) if burn_rate > 0 else 24
    
    funding_raised = random.randint(100000, 10000000) * multiplier
    valuation = funding_raised * random.uniform(5, 15)
    
    return {
        'mrr': round(mrr, 2),
        'arr': round(arr, 2),
        'revenue': round(revenue, 2),
        'growth_rate': round(growth_rate, 2),
        'burn_rate': round(burn_rate, 2),
        'runway_months': runway_months,
        'funding_raised': round(funding_raised, 2),
        'valuation': round(valuation, 2)
    }

def generate_team_metrics(stage):
    """Generate team size metrics"""
    stage_ranges = {
        'seed': (2, 10),
        'early': (5, 25),
        'growth': (15, 75),
        'scale': (50, 300)
    }
    
    min_emp, max_emp = stage_ranges[stage]
    employees = random.randint(min_emp, max_emp)
    founders = random.randint(1, 4)
    advisors = random.randint(0, 8)
    
    return employees, founders, advisors

def generate_market_metrics(stage, sse_score):
    """Generate market and customer metrics"""
    stage_multipliers = {
        'seed': 1,
        'early': 10,
        'growth': 100,
        'scale': 1000
    }
    
    multiplier = stage_multipliers[stage]
    score_factor = sse_score / 100
    
    customers = int(random.randint(10, 1000) * multiplier * score_factor)
    active_users = int(customers * random.uniform(0.6, 0.9))
    market_size = random.randint(100000000, 10000000000)
    market_share = random.uniform(0.0001, 0.05) * score_factor
    
    return customers, active_users, market_size, market_share

def generate_startup_profile(index):
    """Generate a complete startup profile"""
    stage = random.choice(STAGES)
    sse_score = generate_sse_score(stage)
    sse_percentile = int((sse_score / 100) * 100)
    
    financial = generate_financial_metrics(stage, sse_score)
    employees, founders, advisors = generate_team_metrics(stage)
    customers, active_users, market_size, market_share = generate_market_metrics(stage, sse_score)
    
    # Generate founded date (1-5 years ago based on stage)
    stage_years = {'seed': 1, 'early': 2, 'growth': 3, 'scale': 5}
    years_ago = stage_years[stage]
    founded_date = datetime.now() - timedelta(days=random.randint(0, years_ago * 365))
    
    # Generate creation date (within last 2 years)
    created_at = datetime.now() - timedelta(days=random.randint(0, 730))
    
    profile = {
        'company_name': generate_company_name() + f" {index}",  # Ensure uniqueness
        'founder_name': fake.name(),
        'industry': random.choice(INDUSTRIES),
        'sector': random.choice(INDUSTRIES),
        'stage': stage,
        'founded_date': founded_date.date(),
        'sse_score': sse_score,
        'sse_percentile': sse_percentile,
        'sse_score_history': json.dumps([]),
        'last_sse_update': datetime.now(),
        **financial,
        'employees': employees,
        'founders_count': founders,
        'advisors_count': advisors,
        'customers': customers,
        'active_users': active_users,
        'market_size': market_size,
        'market_share': market_share,
        'activities_completed': random.randint(5, 50),
        'activities_pending': random.randint(0, 10),
        'total_tokens': random.randint(100, 5000),
        'current_streak': random.randint(0, 30),
        'country': random.choice(COUNTRIES),
        'city': fake.city(),
        'region': fake.state(),
        'status': 'active',
        'is_verified': random.choice([True, False]),
        'is_featured': random.random() < 0.1,  # 10% featured
        'is_synthetic': True,
        'synthetic_seed': f'seed_{index}',
        'synthetic_algorithm': 'monte_carlo',
        'created_at': created_at,
        'updated_at': datetime.now(),
        'last_activity_at': datetime.now() - timedelta(days=random.randint(0, 30))
    }
    
    return profile

def generate_activities(profile_id, company_name, num_activities):
    """Generate activity feed for a startup"""
    activities = []
    
    # Generate activities over the past 5 years
    for i in range(num_activities):
        # More recent activities are more likely
        days_ago = int(np.random.exponential(180))  # Exponential distribution
        days_ago = min(days_ago, 1825)  # Cap at 5 years
        
        activity_date = datetime.now() - timedelta(days=days_ago)
        
        activity = {
            'profile_id': profile_id,
            'activity_type': random.choice(ACTIVITY_TYPES),
            'activity_category': random.choice(['Customer Discovery', 'Product Development', 'Growth', 'Operations']),
            'activity_title': f"{random.choice(ACTIVITY_TYPES)} - {company_name}",
            'activity_description': fake.sentence(nb_words=15),
            'tokens_earned': random.randint(10, 100),
            'impact_score': round(random.uniform(1, 10), 2),
            'status': 'completed',
            'verification_level': random.choice(['self', 'peer', 'verified']),
            'activity_date': activity_date,
            'created_at': activity_date,
            'is_synthetic': True,
            'synthetic_pattern': 'exponential_distribution'
        }
        
        activities.append(activity)
    
    return activities

def generate_metrics_history(profile_id, num_points):
    """Generate time-series metrics data"""
    metrics = []
    metric_names = ['MRR', 'ARR', 'Customers', 'Active Users', 'Revenue', 'Burn Rate']
    
    for metric_name in metric_names:
        base_value = random.uniform(1000, 100000)
        
        for i in range(num_points):
            weeks_ago = num_points - i
            metric_date = datetime.now() - timedelta(weeks=weeks_ago)
            
            # Add growth trend with some noise
            growth_factor = 1 + (i * 0.02)  # 2% weekly growth
            noise = random.uniform(0.9, 1.1)
            metric_value = base_value * growth_factor * noise
            
            # Calculate delta
            if i > 0:
                prev_value = base_value * (1 + ((i-1) * 0.02)) * random.uniform(0.9, 1.1)
                metric_delta = metric_value - prev_value
                metric_percentage_change = (metric_delta / prev_value) * 100 if prev_value > 0 else 0
            else:
                metric_delta = 0
                metric_percentage_change = 0
            
            metric = {
                'profile_id': profile_id,
                'metric_name': metric_name,
                'metric_category': 'financial' if metric_name in ['MRR', 'ARR', 'Revenue'] else 'growth',
                'metric_value': round(metric_value, 2),
                'metric_delta': round(metric_delta, 2),
                'metric_percentage_change': round(metric_percentage_change, 2),
                'metadata': json.dumps({}),
                'metric_date': metric_date,
                'created_at': metric_date,
                'is_synthetic': True
            }
            
            metrics.append(metric)
    
    return metrics

def seed_database():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    print(f"📊 Generating {NUM_STARTUPS} startup profiles...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        # Generate and insert startup profiles
        print("\n1️⃣ Inserting startup profiles...")
        profile_ids = []
        
        for i in range(NUM_STARTUPS):
            if (i + 1) % 1000 == 0:
                print(f"   Progress: {i + 1}/{NUM_STARTUPS} profiles...")
            
            profile = generate_startup_profile(i + 1)
            
            cur.execute("""
                INSERT INTO startup_profiles (
                    company_name, founder_name, industry, sector, stage, founded_date,
                    sse_score, sse_percentile, sse_score_history, last_sse_update,
                    mrr, arr, revenue, growth_rate, burn_rate, runway_months,
                    funding_raised, valuation, employees, founders_count, advisors_count,
                    customers, active_users, market_size, market_share,
                    activities_completed, activities_pending, total_tokens, current_streak,
                    country, city, region, status, is_verified, is_featured,
                    is_synthetic, synthetic_seed, synthetic_algorithm,
                    created_at, updated_at, last_activity_at
                ) VALUES (
                    %(company_name)s, %(founder_name)s, %(industry)s, %(sector)s, %(stage)s, %(founded_date)s,
                    %(sse_score)s, %(sse_percentile)s, %(sse_score_history)s, %(last_sse_update)s,
                    %(mrr)s, %(arr)s, %(revenue)s, %(growth_rate)s, %(burn_rate)s, %(runway_months)s,
                    %(funding_raised)s, %(valuation)s, %(employees)s, %(founders_count)s, %(advisors_count)s,
                    %(customers)s, %(active_users)s, %(market_size)s, %(market_share)s,
                    %(activities_completed)s, %(activities_pending)s, %(total_tokens)s, %(current_streak)s,
                    %(country)s, %(city)s, %(region)s, %(status)s, %(is_verified)s, %(is_featured)s,
                    %(is_synthetic)s, %(synthetic_seed)s, %(synthetic_algorithm)s,
                    %(created_at)s, %(updated_at)s, %(last_activity_at)s
                ) RETURNING profile_id
            """, profile)
            
            profile_id = cur.fetchone()[0]
            profile_ids.append((profile_id, profile['company_name']))
        
        conn.commit()
        print(f"✅ Inserted {NUM_STARTUPS} startup profiles")
        
        # Generate and insert activities
        print("\n2️⃣ Generating activity feed...")
        total_activities = 0
        
        for idx, (profile_id, company_name) in enumerate(profile_ids):
            if (idx + 1) % 1000 == 0:
                print(f"   Progress: {idx + 1}/{NUM_STARTUPS} profiles...")
            
            num_activities = random.randint(ACTIVITIES_PER_STARTUP_MIN, ACTIVITIES_PER_STARTUP_MAX)
            activities = generate_activities(profile_id, company_name, num_activities)
            
            for activity in activities:
                cur.execute("""
                    INSERT INTO activity_feed (
                        profile_id, activity_type, activity_category, activity_title,
                        activity_description, tokens_earned, impact_score, status,
                        verification_level, activity_date, created_at, is_synthetic,
                        synthetic_pattern
                    ) VALUES (
                        %(profile_id)s, %(activity_type)s, %(activity_category)s, %(activity_title)s,
                        %(activity_description)s, %(tokens_earned)s, %(impact_score)s, %(status)s,
                        %(verification_level)s, %(activity_date)s, %(created_at)s, %(is_synthetic)s,
                        %(synthetic_pattern)s
                    )
                """, activity)
            
            total_activities += num_activities
        
        conn.commit()
        print(f"✅ Inserted {total_activities} activities")
        
        # Generate and insert metrics history
        print("\n3️⃣ Generating metrics history...")
        total_metrics = 0
        
        for idx, (profile_id, _) in enumerate(profile_ids):
            if (idx + 1) % 1000 == 0:
                print(f"   Progress: {idx + 1}/{NUM_STARTUPS} profiles...")
            
            metrics = generate_metrics_history(profile_id, METRICS_POINTS_PER_STARTUP)
            
            for metric in metrics:
                cur.execute("""
                    INSERT INTO metrics_history (
                        profile_id, metric_name, metric_category, metric_value,
                        metric_delta, metric_percentage_change, metadata,
                        metric_date, created_at, is_synthetic
                    ) VALUES (
                        %(profile_id)s, %(metric_name)s, %(metric_category)s, %(metric_value)s,
                        %(metric_delta)s, %(metric_percentage_change)s, %(metadata)s,
                        %(metric_date)s, %(created_at)s, %(is_synthetic)s
                    )
                """, metric)
            
            total_metrics += len(metrics)
        
        conn.commit()
        print(f"✅ Inserted {total_metrics} metric data points")
        
        # Print summary
        print("\n" + "="*60)
        print("🎉 DATABASE SEEDING COMPLETE!")
        print("="*60)
        print(f"📊 Startup Profiles:  {NUM_STARTUPS:,}")
        print(f"📈 Activities:        {total_activities:,}")
        print(f"📉 Metrics Points:    {total_metrics:,}")
        print(f"📅 Date Range:        Last 5 years")
        print(f"🔄 Rolling Feed:      365 days (default)")
        print(f"🕐 5-Year Toggle:     Available")
        print("="*60)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed_database()
