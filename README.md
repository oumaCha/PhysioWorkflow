# PhysioWorkflow – Workflow Modeling and Execution System for Physiotherapy

PhysioWorkflow is a web-based workflow modeling and execution system designed for physiotherapy treatment processes.  
The system was developed as part of a Master’s thesis titled:

> **Design and Implementation of a Workflow Modeling and Execution System for Physiotherapy Treatment Processes**

---

## 🎯 Purpose

PhysioWorkflow aims to support structured documentation, execution, and traceability of physiotherapy treatment workflows while respecting:

- Role-based access control (RBAC)
- Deterministic workflow execution semantics
- Lightweight, domain-specific modeling


## 🏗 Architecture

The system follows a layered architecture:

- **Frontend:** Browser-based web application (Vite + React)
- **Backend:** Spring Boot REST API
- **Database:** PostgreSQL
- **Authentication:** Session-based (JSESSIONID)

Workflow execution logic is encapsulated in a lightweight domain-specific workflow engine.

---
## 🖥 System Requirements

Before installing PhysioWorkflow, ensure the following software is installed:

- Java 17+

- Maven 3.9+ (or use Maven Wrapper mvnw)

- Node.js 18+

- npm 9+

PostgreSQL 14+
# 📜 License
This project is licensed under the MIT License.

