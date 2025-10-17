#!/bin/bash

# SDG 8: Decent Work & Economic Growth
cat > esg_work_enhanced.html << 'WORK_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auxeira SDG 8: Decent Work & Economic Growth - Institutional ESG Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://js.paystack.co/v1/inline.js"></script>
    <style>
        :root {
            --primary-color: #dc2626;
            --secondary-color: #ef4444;
            --dark-bg: #0a0a0a;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --text-primary: #ffffff;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--dark-bg) 0%, #050505 100%);
            color: var(--text-primary);
            min-height: 100vh;
        }
        .live-update-bar {
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            padding: 0.5rem 1rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
        }
        .dashboard-header {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            padding: 2rem 0;
        }
        .sdg-badge {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .glass-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .metric-number {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .chart-container { height: 400px; margin: 1rem 0; }
    </style>
</head>
<body>
    <div class="live-update-bar">
        <span>Live Employment Data Feed</span>
        <span>Last updated: 2024-10-16 14:23:45 UTC</span>
    </div>
    
    <header class="dashboard-header">
        <div class="container">
            <div class="sdg-badge">
                <i class="fas fa-briefcase"></i>
                SDG 8: Decent Work & Economic Growth
            </div>
            <h1><span id="orgName">BlackRock</span> Employment Impact Dashboard</h1>
            <p class="lead">Institutional-grade analytics for job creation and economic development investments</p>
        </div>
    </header>
    
    <div class="container">
        <div class="row">
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">4.2M</div>
                    <div class="text-muted">Jobs Created</div>
                    <small class="text-success">+890K this year</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">87%</div>
                    <div class="text-muted">Employment Rate</div>
                    <small class="text-success">+12% improvement</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">$2,340</div>
                    <div class="text-muted">Avg Income Increase</div>
                    <small class="text-success">+34% vs baseline</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">91</div>
                    <div class="text-muted">Job Quality Score</div>
                    <small class="text-success">+8 points</small>
                </div>
            </div>
        </div>
        
        <div class="glass-card">
            <h4>Employment Analytics & Economic Growth Projections</h4>
            <div class="chart-container">
                <canvas id="mainChart"></canvas>
            </div>
        </div>
        
        <div class="glass-card">
            <h4>Premium Employment Intelligence Reports</h4>
            <div class="row">
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>SDG 8 Quarterly Employment Report</h6>
                        <p class="small">Comprehensive job creation and economic impact analysis...</p>
                        <button class="btn btn-success btn-sm">Free Download</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>Advanced Labor Market Analytics</h6>
                        <p class="small">AI-powered employment trend forecasting...</p>
                        <button class="btn btn-warning btn-sm">$49 - Unlock</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>Economic Development Strategy</h6>
                        <p class="small">Portfolio optimization for job creation impact...</p>
                        <button class="btn btn-danger btn-sm">$199 - Unlock</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const ctx = document.getElementById('mainChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2020', '2021', '2022', '2023', '2024', '2025 (Proj)'],
                datasets: [{
                    label: 'Jobs Created (Millions)',
                    data: [2.1, 2.8, 3.4, 3.9, 4.2, 4.8],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#ffffff' } } },
                scales: {
                    y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    </script>
</body>
</html>
WORK_EOF

# SDG 9: Industry, Innovation & Infrastructure  
cat > esg_innovation_enhanced.html << 'INNOVATION_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auxeira SDG 9: Industry, Innovation & Infrastructure - Institutional ESG Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary-color: #3b82f6;
            --secondary-color: #60a5fa;
            --dark-bg: #0a0a0a;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --text-primary: #ffffff;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--dark-bg) 0%, #050505 100%);
            color: var(--text-primary);
            min-height: 100vh;
        }
        .live-update-bar {
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            padding: 0.5rem 1rem;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
        }
        .dashboard-header {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            padding: 2rem 0;
        }
        .sdg-badge {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .glass-card {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .metric-number {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .chart-container { height: 400px; margin: 1rem 0; }
    </style>
</head>
<body>
    <div class="live-update-bar">
        <span>Live Innovation Data Feed</span>
        <span>Last updated: 2024-10-16 14:23:45 UTC</span>
    </div>
    
    <header class="dashboard-header">
        <div class="container">
            <div class="sdg-badge">
                <i class="fas fa-cogs"></i>
                SDG 9: Industry, Innovation & Infrastructure
            </div>
            <h1><span id="orgName">BlackRock</span> Innovation Impact Dashboard</h1>
            <p class="lead">Institutional-grade analytics for technology and infrastructure investments</p>
        </div>
    </header>
    
    <div class="container">
        <div class="row">
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">$12.4B</div>
                    <div class="text-muted">Infrastructure Investment</div>
                    <small class="text-success">+$2.8B this year</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">340</div>
                    <div class="text-muted">Innovation Projects</div>
                    <small class="text-success">+89 new projects</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">89%</div>
                    <div class="text-muted">Digital Connectivity</div>
                    <small class="text-success">+23% coverage</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="glass-card text-center">
                    <div class="metric-number">94</div>
                    <div class="text-muted">Innovation Index</div>
                    <small class="text-success">+12 points</small>
                </div>
            </div>
        </div>
        
        <div class="glass-card">
            <h4>Infrastructure & Innovation Analytics</h4>
            <div class="chart-container">
                <canvas id="mainChart"></canvas>
            </div>
        </div>
        
        <div class="glass-card">
            <h4>Premium Innovation Intelligence Reports</h4>
            <div class="row">
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>SDG 9 Quarterly Innovation Report</h6>
                        <p class="small">Technology adoption and infrastructure development analysis...</p>
                        <button class="btn btn-success btn-sm">Free Download</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>Advanced Technology Trends</h6>
                        <p class="small">AI-powered innovation forecasting and market analysis...</p>
                        <button class="btn btn-warning btn-sm">$49 - Unlock</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="border rounded p-3 mb-3">
                        <h6>Infrastructure Investment Strategy</h6>
                        <p class="small">Portfolio optimization for maximum innovation impact...</p>
                        <button class="btn btn-danger btn-sm">$199 - Unlock</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const ctx = document.getElementById('mainChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2020', '2021', '2022', '2023', '2024', '2025 (Proj)'],
                datasets: [{
                    label: 'Infrastructure Investment ($B)',
                    data: [6.8, 8.2, 9.7, 11.1, 12.4, 14.2],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#ffffff' } } },
                scales: {
                    y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });
    </script>
</body>
</html>
INNOVATION_EOF

echo "Created SDG 8 and SDG 9 dashboards"
