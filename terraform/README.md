# ☁️ BATTLEVERSE AWS Terraform Infrastructure

Production Infrastructure as Code (IaC) for **BATTLEVERSE: 3V3 HERO ARENA** on AWS.

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    User["🌐 Players / Internet"] -->|HTTP: 80 / HTTPS: 443| Nginx["Nginx Reverse Proxy\n(EC2 Public Subnet)"]
    
    subgraph "VPC: 10.0.0.0/16 (ap-south-1)"
        subgraph "Public Subnet: 10.0.1.0/24"
            Nginx -->|Proxy: 8080| Frontend["React/Vite Frontend Container"]
            Nginx -->|Proxy: 5000 /api| Backend["Node.js Express REST + Socket.IO"]
        end
        
        subgraph "Private Subnet: 10.0.2.0/24 & 10.0.3.0/24"
            Backend -->|Port 3306 (Internal Only)| RDS["Amazon RDS MySQL 8.0\n(Private Subnet Group)"]
        end
    end
    
    Backend -->|IAM Role: sns:Publish| SNS["AWS SNS Topic\n(battleverse-notifications)"]
    SNS -->|Email Alert| Email["ajithkumar31082004@gmail.com"]
```

---

## 📁 Terraform File Structure

```text
terraform/
├── versions.tf               # Terraform & AWS provider version constraints
├── provider.tf               # AWS Provider configuration with default tags
├── variables.tf              # Input variables (Region, VPC, DB, SNS, etc.)
├── terraform.tfvars.example  # Template for secret variables (ignored by git)
├── locals.tf                 # Common tags and naming conventions
├── vpc.tf                    # VPC, Public/Private Subnets, IGW, Route Tables
├── security_groups.tf        # Least-privilege EC2 and RDS Security Groups
├── ec2.tf                    # Ubuntu 22.04 LTS EC2 Instance + 20GB GP3
├── rds.tf                    # Private Amazon RDS MySQL instance
├── sns.tf                    # SNS Notification Topic & Email Subscription
├── iam.tf                    # IAM Role & Instance Profile for EC2 SNS access
├── user_data.sh              # Cloud-init script (Docker, Compose, Git, Nginx)
├── outputs.tf                # Exposed outputs (Public IP, RDS Endpoint, SNS ARN)
└── README.md                 # Master Terraform guide
```

---

## 🚀 Quick Deployment Guide

### Step 1: Configure Variables
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your secure database password and IP
```

### Step 2: Initialize & Validate
```bash
terraform init
terraform fmt -recursive
terraform validate
```

### Step 3: Plan Infrastructure
```bash
terraform plan -out=tfplan
```

### Step 4: Apply Deployment
```bash
terraform apply tfplan
```

---

## 📧 Confirming SNS Email Subscription
1. After running `terraform apply`, AWS dispatches an automated verification email to `ajithkumar31082004@gmail.com`.
2. Open the email from **AWS Notifications** with subject *"AWS Notification - Subscription Confirmation"*.
3. Click the link **"Confirm subscription"**.
4. The status in AWS SNS will update from `PendingConfirmation` to `Confirmed`.

---

## 🔍 Verification Commands

### Check AWS Resources via AWS CLI:
```bash
# Verify Caller Identity
aws sts get-caller-identity

# Check EC2 Status
aws ec2 describe-instances --filters "Name=tag:Project,Values=Battleverse"

# Check Private RDS MySQL Status
aws rds describe-db-instances --db-instance-identifier battleverse-prod-mysql

# Check SNS Topic
aws sns list-topics
```

### Verify Running EC2 Instance:
```bash
# SSH into EC2
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>

# Check Docker services
docker ps

# Check Nginx status
sudo systemctl status nginx

# Test Health Endpoint
curl http://localhost/api/health
```

---

## 🧹 Destroy Infrastructure
> ⚠️ **Warning:** Running this command will permanently terminate all EC2 instances, delete the RDS database, and remove all network configuration.

```bash
terraform destroy
```
