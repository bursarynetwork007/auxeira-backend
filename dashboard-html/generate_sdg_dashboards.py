import os
import json
from datetime import datetime

# SDG configuration data
sdg_config = {
    "3": {
        "title": "Good Health & Well-being",
        "icon": "fas fa-heartbeat",
        "color_primary": "#e11d48",
        "color_secondary": "#f43f5e",
        "focus": "Healthcare Access & Medical Innovation",
        "filename": "esg_health_enhanced.html"
    },
    "4": {
        "title": "Quality Education", 
        "icon": "fas fa-graduation-cap",
        "color_primary": "#dc2626",
        "color_secondary": "#ef4444", 
        "focus": "Educational Access & Skills Development",
        "filename": "esg_education_enhanced.html"
    },
    "5": {
        "title": "Gender Equality",
        "icon": "fas fa-venus-mars", 
        "color_primary": "#f59e0b",
        "color_secondary": "#fbbf24",
        "focus": "Women's Empowerment & Economic Inclusion",
        "filename": "esg_gender_enhanced.html"
    }
}

# Generate basic enhanced dashboard template
def generate_dashboard(sdg_num, config):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auxeira SDG {sdg_num}: {config["title"]} - Institutional ESG Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://js.paystack.co/v1/inline.js"></script>
    <style>
        :root {{
            --primary-color: {config["color_primary"]};
            --secondary-color: {config["color_secondary"]};
            --dark-bg: #0a0a0a;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
        }}
        
        body {{
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--dark-bg) 0%, #050505 100%);
            color: var(--text-primary);
            min-height: 100vh;
        }}
        
        .high-contrast {{
            --glass-bg: rgba(255, 255, 255, 0.15);
            --glass-border: rgba(255, 255, 255, 0.3);
        }}
        
        .accessibility-controls {{
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1001;
            display: flex;
            gap: 0.5rem;
        }}
        
        .accessibility-btn {{
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            padding: 0.5rem;
            border-radius: 8px;
            cursor: pointer;
        }}
        
        .live-update-bar {{
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            padding: 0.5rem 1rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
        }}
        
        .dashboard-header {{
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--glass-border);
            padding: 2rem 0;
        }}
        
        .sdg-badge {{
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }}
        
        .compliance-badges {{
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }}
        
        .compliance-badge {{
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
        }}
        
        .glass-card {{
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
        }}
        
        .glass-card:hover {{
            transform: translateY(-2px);
            border-color: var(--primary-color);
        }}
        
        .glass-card.ai-powered::before {{
            content: '🤖 AI-Generated';
            position: absolute;
            top: -10px;
            right: 15px;
            background: linear-gradient(45deg, #1e40af, #7c3aed);
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.7rem;
        }}
        
        .metric-number {{
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }}
        
        .metric-label {{
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
        }}
        
        .chart-container {{
            height: 400px;
            margin: 1rem 0;
        }}
        
        .report-preview {{
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
        }}
        
        .report-preview.locked::after {{
            content: '🔒';
            position: absolute;
            top: 10px;
            right: 10px;
        }}
        
        .btn-unlock {{
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border: none;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 25px;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="accessibility-controls">
        <button class="accessibility-btn" onclick="toggleHighContrast()">
            <i class="fas fa-adjust"></i>
        </button>
    </div>
    
    <div class="live-update-bar">
        <span>Live Data Feed Active</span>
        <span>Last updated: {timestamp}</span>
    </div>
    
    <header class="dashboard-header">
        <div class="container">
            <div class="sdg-badge">
                <i class="{config["icon"]}"></i>
                SDG {sdg_num}: {config["title"]}
            </div>
            <h1><span id="orgName">BlackRock</span> {config["focus"]} Dashboard</h1>
            <p class="lead">Institutional-grade analytics with real-time monitoring and AI-powered insights</p>
            <div class="compliance-badges">
                <div class="compliance-badge">SFDR Article 9 Compliant</div>
                <div class="compliance-badge">CSRD Reporting Ready</div>
                <div class="compliance-badge">TCFD Aligned</div>
            </div>
        </div>
    </header>
    
    <div class="container">
        <div class="row">
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">2.4M</div>
                    <div class="metric-label">People Impacted</div>
                    <small class="text-success">+340K this quarter</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">89%</div>
                    <div class="metric-label">Success Rate</div>
                    <small class="text-success">+12% improvement</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">284%</div>
                    <div class="metric-label">Social ROI</div>
                    <small class="text-success">+45% vs benchmark</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">92</div>
                    <div class="metric-label">Impact Score</div>
                    <small class="text-success">+8 points</small>
                </div>
            </div>
        </div>
        
        <div class="glass-card ai-powered">
            <h4>Impact Analytics & AI Projections</h4>
            <div class="chart-container">
                <canvas id="mainChart" aria-label="Main impact analytics chart"></canvas>
            </div>
        </div>
        
        <div class="glass-card">
            <h4>Premium Reports for BlackRock</h4>
            <div class="row">
                <div class="col-md-4">
                    <div class="report-preview">
                        <h6>SDG {sdg_num} Quarterly Impact Report</h6>
                        <p class="small">Comprehensive analysis of {config["focus"].lower()} impact across your investment portfolio...</p>
                        <button class="btn btn-success">Free Download</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-preview locked">
                        <h6>Advanced {config["title"]} Analytics</h6>
                        <p class="small">Deep-dive analysis with AI insights and predictive modeling...</p>
                        <button class="btn-unlock" onclick="purchaseReport('advanced', 49)">$49 - Unlock</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-preview locked">
                        <h6>Strategic Optimization Report</h6>
                        <p class="small">Portfolio optimization recommendations for maximizing SDG {sdg_num} impact...</p>
                        <button class="btn-unlock" onclick="purchaseReport('optimization', 199)">$199 - Unlock</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize chart
        const ctx = document.getElementById('mainChart').getContext('2d');
        new Chart(ctx, {{
            type: 'line',
            data: {{
                labels: ['2020', '2021', '2022', '2023', '2024', '2025 (Proj)', '2026 (Proj)'],
                datasets: [{{
                    label: 'Impact Trend',
                    data: [65, 72, 78, 84, 89, 95, 98],
                    borderColor: '{config["color_primary"]}',
                    backgroundColor: '{config["color_primary"]}20',
                    tension: 0.4,
                    fill: true
                }}, {{
                    label: 'AI Projection',
                    data: [null, null, null, null, 89, 95, 98],
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    tension: 0.4
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{ 
                    legend: {{ labels: {{ color: '#ffffff' }} }} 
                }},
                scales: {{
                    y: {{ 
                        ticks: {{ color: '#ffffff' }}, 
                        grid: {{ color: 'rgba(255,255,255,0.1)' }} 
                    }},
                    x: {{ 
                        ticks: {{ color: '#ffffff' }}, 
                        grid: {{ color: 'rgba(255,255,255,0.1)' }} 
                    }}
                }}
            }}
        }});
        
        function toggleHighContrast() {{
            document.body.classList.toggle('high-contrast');
        }}
        
        function purchaseReport(type, price) {{
            alert(`Report purchase: $${price} - Feature will be implemented with Paystack integration`);
        }}
    </script>
</body>
</html>'''
    
    return template

# Generate dashboards
for sdg_num, config in sdg_config.items():
    with open(config["filename"], 'w') as f:
        f.write(generate_dashboard(sdg_num, config))
    print(f"Generated {config['filename']}")

print("Enhanced SDG dashboard generation complete!")
