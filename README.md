# 🚀 Backend Service — Cloud-Native E-Commerce App

---

## 🧠 Project Overview

This repository contains the **backend** of my production-style MERN e-commerce application.

It is containerized with Docker, built and published through **Azure DevOps Pipelines**, stored in **AWS Elastic Container Registry (ECR)**, and deployed to **Amazon EKS** using a **GitOps workflow with ArgoCD and Helm**.

- Application source code is stored in GitHub  
- CI is handled by **Azure DevOps Pipelines**  
- Docker images are pushed to **AWS Elastic Container Registry (ECR)**  
- Deployment configuration is stored in a separate **GitOps repository**  
- **ArgoCD** watches the GitOps repo and deploys changes to **Amazon EKS**

---

## 🏗️ Architecture Flow

```text
Backend Code (GitHub)
        ↓
Azure DevOps Pipeline
        ↓
Validate → Build Docker Image
        ↓
Push Image to AWS ECR
        ↓
Update Helm Values in GitOps Repository
        ↓
ArgoCD Detects Change
        ↓
Deploy to Amazon EKS 🚀
