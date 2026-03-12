# VPC Configuration for Lambda

Your Lambda is now configured to run in VPC `vpc-08cfd89a7cff5f870` with private access.

## Required Information Before Deployment

### 1. Get Private Subnet IDs
```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-08cfd89a7cff5f870" --query "Subnets[?MapPublicIpOnLaunch==\`false\`].[SubnetId,AvailabilityZone]" --output table
```

You need at least 2 private subnets in different AZs.

### 2. Get RDS Security Group ID
```bash
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=vpc-08cfd89a7cff5f870" --query "SecurityGroups[*].[GroupId,GroupName]" --output table
```

Find the security group attached to your RDS instance.

## Deploy Command

```bash
sam build && sam deploy \
  --parameter-overrides \
    Environment=dev \
    VpcId=vpc-08cfd89a7cff5f870 \
    SubnetIds=subnet-xxxxx,subnet-yyyyy \
    DBSecurityGroupId=sg-xxxxx \
    DBHost=your-rds-endpoint.region.rds.amazonaws.com \
    DBUser=postgres \
    DBPassword=YourPassword \
    CorsOrigin=https://your-frontend.com
```

## Architecture

```
Internet → API Gateway (Public) → Lambda (Private VPC) → RDS (Private VPC)
```

- **API Gateway**: Public endpoint (only entry point)
- **Lambda**: Private subnets, no internet access
- **RDS**: Private, accessible only by Lambda security group

## Important Notes

1. **NAT Gateway**: If Lambda needs internet access (e.g., external APIs), add NAT Gateway to private subnets
2. **VPC Endpoints**: For AWS services (Secrets Manager), use VPC endpoints to avoid NAT costs
3. **Cold Start**: VPC Lambdas have ~1-2s additional cold start time
4. **Security**: Lambda has no public IP, only API Gateway is publicly accessible
