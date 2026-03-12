# Track Activities Backend - AWS Serverless

This backend has been transformed to run on AWS Lambda with API Gateway.

## Architecture

- **AWS Lambda**: Runs the Express application
- **API Gateway (HTTP API)**: Routes requests to Lambda
- **RDS PostgreSQL**: Database (existing or new)
- **Secrets Manager**: Stores JWT secret securely
- **SAM (Serverless Application Model)**: Infrastructure as Code

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **AWS SAM CLI** installed
   ```bash
   # Windows (using Chocolatey)
   choco install aws-sam-cli
   
   # Or download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
   ```

3. **Node.js 20.x** installed

## Local Development

The application still works locally with Express:

```bash
npm install
npm run dev
```

## Deployment to AWS

### First Time Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Deploy with guided setup**:
   ```bash
   npm run deploy:guided
   ```

   You'll be prompted for:
   - Stack name (e.g., `track-activities-backend-dev`)
   - AWS Region (e.g., `us-east-1`)
   - Database parameters (DBHost, DBUser, DBPassword, DBName)
   - CORS origin (your frontend URL)

### Subsequent Deployments

```bash
npm run deploy
```

SAM now builds the Lambda entrypoint directly from `src/lambda.ts` using `esbuild`, so the deployed handler is `lambda.handler`. You can still run `npm run build` for local TypeScript validation, but deployment no longer depends on a prebuilt `dist/` folder.

## Database Setup

### Option 1: Use Existing RDS Instance
Provide your existing RDS endpoint during deployment.

### Option 2: Create New RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier track-activities-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --publicly-accessible
```

### Run Migrations

After deployment, connect to your RDS instance and run:

```bash
psql -h your-rds-endpoint.region.rds.amazonaws.com -U postgres -d follow_activities -f migrations/001_initial_schema.sql
```

## Environment Variables

The SAM template manages these automatically:
- `NODE_ENV`: Environment (dev/staging/prod)
- `DB_HOST`: RDS endpoint
- `DB_PORT`: Database port (5432)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Auto-generated in Secrets Manager
- `CORS_ORIGIN`: Frontend URL

## Monitoring

View logs in CloudWatch:
```bash
sam logs -n ApiFunction --stack-name track-activities-backend-dev --tail
```

## Cost Optimization

- Lambda: First 1M requests/month free, then $0.20 per 1M requests
- API Gateway: First 1M requests/month free, then $1.00 per 1M requests
- RDS: Consider Aurora Serverless v2 for variable workloads

## Cleanup

To delete all resources:
```bash
sam delete --stack-name track-activities-backend-dev
```

## Differences from Traditional Server

1. **Cold Starts**: First request may be slower (~1-2s)
2. **Connection Pooling**: Optimized for Lambda (max 2 connections)
3. **Stateless**: No in-memory session storage
4. **Timeout**: 30 seconds max per request

## Troubleshooting

### Lambda can't connect to RDS
- Ensure Lambda and RDS are in the same VPC
- Check security group rules allow Lambda to access RDS on port 5432

### Runtime.ImportModuleError: Cannot find module 'lambda' or 'dist/lambda'
- Run `sam build` again after updating the template
- Redeploy so Lambda picks up the generated `lambda.js` artifact
- Confirm the deployed handler is `lambda.handler`

### High latency
- Consider using RDS Proxy for connection pooling
- Increase Lambda memory (improves CPU)

### CORS errors
- Update `CorsOrigin` parameter in deployment
- Check API Gateway CORS configuration
