# 🎤 Portfolio Management System - Technical Architecture Presentation

**Estimated Duration**: 5-7 minutes  
**Applicable Scenarios**: Project reporting, technical sharing, graduation defense  
**Technology Stack**: Spring Boot 3.4.5 + MySQL 8.0 + Caffeine Cache

---

## [Opening] (Approx. 0.5 minutes)

Hello everyone, I'll now present the **System Core Architecture** of our project.

My teammate has just given you a comprehensive overview of the entire project, so I believe everyone already has a basic understanding of the system. Now, I will take you deeper into the technical internals to uncover how this system works from an architectural design perspective. I will explain the system from four dimensions: overall architecture, business logic layering, data flow mechanisms, and database design.

---

## Part 1: System Overall Architecture (Approx. 1.5 minutes)

*(With PPT Page 1: System Core Architecture)*

First, let's overview the entire technology stack of our system.

Our system adopts a classic **three-tier architecture** design:

### Frontend Layer
We have built a complete user interface including **Dashboard**, **Holdings Management**, **Transaction Records**, **Search Functionality**, and **AI Assistant**. The frontend interacts with the backend through standard **HTTP REST API**, achieving complete separation of front-end and back-end.

### Application Layer
We use the latest **Spring Boot 3.4.5** framework. This layer strictly follows a layered architecture pattern:
- **Controller** is responsible for routing and request handling
- **Service** carries core business logic and data validation
- **Repository** handles data access operations

We use **JPA/Hibernate** as the ORM mapping tool, which greatly simplifies the transformation between objects and relational databases.

### Data Layer
We use **MySQL 8.0** as persistent storage and introduce **Caffeine** as a local caching solution to accelerate market data reading for high-frequency access and reduce database pressure.

This three-tier architecture not only ensures system modularity but also lays a solid foundation for future expansion.

---

## Part 2: Business Logic Layer Details

Next, we dive into the core of the system—the business logic layer. We strictly followed the principle of separation of duties, breaking down the complex stock trading process into a clear logical chain.

The **Controller layer** acts as a "dispatcher" with three core endpoints:
- **HoldingController**: Handles HTTP requests related to holdings, including buy and sell operations
- **TransactionController**: Processes queries and statistics for transaction records
- **StockController**: Provides stock search and real-time quote interfaces

It's important to emphasize that the Controller layer contains no specific business logic. It only receives requests, validates parameters, calls the Service layer, and returns responses. All business rules are implemented in the Service layer.

The true sophistication lies in the fine division of labor at the service layer:

- **HoldingService (Asset Manager)**: Responsible for core portfolio calculations, including cost accounting, profit/loss tracking, balance checking, and fee calculation (total fee rate: 0.02%)
- **StockService (Market Liaison)**: Interfaces with external market data, integrates Sina API, uses UA rotation and 3-retry strategies, and accelerates high-frequency data access through Caffeine caching

The entire business processing flow forms a rigorous seven-step closed loop: parameter validation → real-time quote → amount calculation → balance check → holding update → transaction record creation.

(Gesture emphasis, slow down speech)

This is the most critical design point of the entire system! We used the `@Transactional` annotation at the class level in HoldingService with `rollbackFor = Exception.class`. This ensures **transaction atomicity and exception rollback**—any exception triggers immediate rollback, completely eliminating "partial success" problems like money deducted but shares not received.

(Can emphasize this way, with heavier tone)

It is precisely this line of code that ensures our system, when facing network fluctuations or logical errors, still strictly maintains the bottom line of "accounts match reality" like a banking system.

*(PPT switches to Page 3: Complete Data Flow Analysis)*

## Part 3: Complete Data Flow Analysis

When a user clicks the "Buy" button on the interface, how does the data flow? Let's quickly trace it.

**Step 1: User Action** — User triggers interaction on the frontend

**Step 2: HTTP Request** — Browser sends POST request to backend with stock code, quantity, and date

**Step 3: Controller Layer** — RestController receives request and dispatches to corresponding Service method

**Step 4: Service Layer** — Service executes core business: obtains real-time price, calculates total amount and fees, checks cash balance

**Step 5: Persistence Layer** — JpaRepository converts to SQL operations

**Step 6: Database Execution** — MySQL executes INSERT or UPDATE statements

**Step 7: Response Encapsulation** — Backend encapsulates result as JSON format

**Step 8: Page Rendering** — Frontend parses JSON and dynamically updates holdings list and account balance

This data flow features: **Unidirectional flow**, **Exception controllability**, **Performance optimization**.

*(PPT switches to Page 4: Database Table Structure)*

## Part 4: Database Table Structure Design

Finally, let's look at the foundation that supports the above logic—the database table structure.

We have two core tables:

**Holding Table**: Records the user's current holdings status, including key fields such as ticker, volume, and cost price.

**Transaction Table**: Records the history of each transaction, linked to holdings via foreign key, storing transaction type, volume, price, and other information.

(Gesture to emphasize key points)

This is the key design that ensures data integrity! The Transaction table forms a one-to-many strong relationship with the Holding table through the foreign key `holdingId` linking to the primary key `id` in the Holding table.

This design has four major advantages: **Traceability**—every transaction can be accurately traced to specific holdings; **Data integrity**—cannot create "orphan" transaction records; **Query efficiency**—quickly retrieves all historical operations for a holding through `holdingId`; **Audit-friendly**—provides complete data chains for subsequent profit/loss analysis.

For example, when a user wants to view all buy/sell records for a stock, just three steps: find the corresponding id in Holding table → query all records with that id in Transaction table → get the complete transaction history.

---

## [Conclusion & Demo Transition]

To summarize: This project uses Spring Boot's three-tier architecture, `@Transactional` for transaction safety, RESTful APIs for front-end/back-end separation, and database foreign key relationships for data traceability.

That concludes my technical overview. **Now, let Drake give you a live demonstration!**
