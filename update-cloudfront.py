import json

with open('current-config-full.json', 'r') as f:
    data = json.load(f)

config = data['DistributionConfig']

# Use S3 REST endpoint (not website endpoint) to keep OAC
config['Origins']['Items'][0]['DomainName'] = 'auxeira-dashboards-jsx-1759943238.s3.amazonaws.com'
config['Origins']['Items'][0]['Id'] = 'S3-auxeira-dashboards'

# Keep the existing S3OriginConfig and OAC settings
config['Origins']['Items'][0]['S3OriginConfig'] = {
    'OriginAccessIdentity': ''
}

config['DefaultCacheBehavior']['TargetOriginId'] = 'S3-auxeira-dashboards'

with open('updated-config.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Updated configuration with S3 REST endpoint and OAC")
