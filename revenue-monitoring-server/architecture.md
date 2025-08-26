# Revenue Monitoring Server - Backend Architecture

## Project Structure Overview

```
revenue-monitoring-server/
├── src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/
│   ├── RevenueMonitoringServerApplication.java    # Main Spring Boot Application Entry Point
│   │
│   ├── configs/                                   # Configuration & Setup Classes
│   │   └── Caching, CORS, Webex, Redis, Query Configs
│   │
│   ├── controllers/                               # REST API Endpoints (13 controllers)
│   │   └── Revenue, Operations, Integration & Common endpoints
│   │
│   ├── services/                                  # Business Logic Layer (13 services)
│   │   └── Data processing, monitoring & integration logic
│   │
│   ├── utils/                                     # Utility & Helper Classes
│   │   └── Cache, DB, Excel & MongoDB management utilities
│   │
│   ├── repository/                                # Data Access Layer
│   │   └── Redis repository interface & implementation
│   │
│   ├── models/                                    # Data Transfer Objects
│   │   └── Business entities, DTOs & request/response models
│   │
│   ├── scheduler/                                 # Background Job Scheduling
│   │   └── Automated cache refresh scheduler
│   │
│   └── queue/                                     # Message Queue Implementation
│       └── Redis pub/sub publisher & subscriber components
│
└── src/main/resources/
    └── Application, cache strategy & SQL query configurations
```

## Architecture Components

_Note: This document provides a high-level architectural overview. For specific file names and detailed component listings, refer to Appendix A at the bottom of this document._

### **1. Application Entry Point**

- **RevenueMonitoringServerApplication.java**: Main Spring Boot application class that bootstraps the entire application with auto-configuration for web, data, caching, and scheduling components.

### **2. Configuration Layer (`configs/`)**

- **DataSourceConfig**: Configures HikariCP connection pool for Oracle database connectivity with primary/secondary datasource support
- **RedisConfig**: Sets up Redis connection factory and templates for caching operations
- **CacheConfig**: Manages cache refresh interval beans loaded from properties files
- **QueryConfigs**: Defines SQL query beans for dependency injection across services
- **CorsConfig**: Enables cross-origin requests for frontend integration
- **WebexConfig**: Configures Webex Teams API for notification services

### **3. REST API Layer (`controllers/`)**

Provides RESTful endpoints for each business domain:

- **Revenue Process Controllers**: Handle Order-to-Cash (O2C), Invoice-to-Cash (I2C), GL Posting, Revenue Accounting monitoring
- **Operations Controllers**: Manage period close tracking, operations controls, and business insights
- **Integration Controllers**: Handle CMS monitoring, ESP case management, and Webex messaging
- **Common Controller**: Provides shared utilities like user authentication and system health checks

### **4. Business Logic Layer (`services/`)**

Core business logic processing for each functional area:

- **Data Processing Services**: Query Oracle databases, transform data, and manage Redis caching
- **Monitoring Services**: Implement business rules for exception detection and performance monitoring
- **Integration Services**: Handle external system communications (Webex, MongoDB)
- **Cache Management**: Coordinate with CacheCommon utility for efficient data caching strategies

### **5. Data Access & Utilities (`utils/`, `repository/`)**

- **JdbcManager**: Centralized database query execution with connection management
- **CacheCommon**: Redis cache operations with async refresh capabilities and memory leak prevention
- **MongoDBManager**: MongoDB operations for persistent storage
- **RedisRepository**: Interface and implementation for Redis operations
- **ExcelReader**: File processing utilities for data imports
- **Common**: Shared utility functions across the application

### **6. Data Models (`models/`)**

Plain Old Java Objects (POJOs) representing:

- Business entities (orders, deals, errors)
- Request/response DTOs for API operations
- Internal data structures for processing workflows

### **7. Background Processing (`scheduler/`)**

- **CacheRefresh**: Scheduled job that runs every 10 minutes to refresh cached data from Oracle databases, with circuit breaker pattern to prevent memory overflow and concurrency issues

### **8. Message Queue (`queue/`)**

- **Redis Pub/Sub Implementation**: Enables asynchronous communication between application components and potential future microservices

## Key Technical Features

### **Caching Strategy**

- **Multi-tier Caching**: Redis for distributed caching with configurable refresh intervals (56-60 minutes staggered)
- **Memory Management**: Implemented proper async operation cleanup to prevent memory leaks
- **Cache Preloading**: Background scheduler ensures data freshness without user-facing latency

### **Database Integration**

- **Primary Oracle Database**: Main transactional data source with HikariCP connection pooling
- **MongoDB**: Document storage for flexible data structures and audit logs
- **Redis**: High-performance caching and session management

### **Monitoring & Observability**

- **Comprehensive Logging**: SLF4J logging throughout application layers
- **Error Tracking**: Structured error handling and reporting
- **Performance Monitoring**: Cache hit/miss tracking and query performance metrics

### **Scalability Features**

- **Async Processing**: Non-blocking cache refresh operations
- **Connection Pooling**: Optimized database connection management
- **Stateless Design**: Enables horizontal scaling in containerized environments

This architecture supports Cisco's Order-to-Cash revenue monitoring requirements with enterprise-grade performance, reliability, and maintainability.

### **The Future**

Here are two major optimization initiatives for enhancing the server architecture:

#### **1. Intelligent Cache Optimization & Predictive Refresh**

**Current State**: The system uses a simple time-based cache refresh strategy (56-60 minutes staggered) that refreshes all cached data regardless of actual usage patterns or data volatility.

**Future Initiative**: Implement an intelligent caching system with:

- **Usage-Based Cache Prioritization**: Track API endpoint access patterns and cache hit/miss ratios to prioritize frequently accessed data for more aggressive caching
- **Data Change Detection**: Integrate with Oracle database triggers or change data capture (CDC) to refresh cache only when underlying data actually changes, rather than on fixed intervals
- **Predictive Cache Warming**: Use machine learning algorithms to predict which data will be requested based on historical patterns (e.g., month-end period close activities) and pre-populate cache accordingly
- **Cache Tiering Strategy**: Implement multiple cache layers (L1: in-memory, L2: Redis, L3: optimized database views) with automatic promotion/demotion based on access frequency
- **Real-time Cache Invalidation**: Replace batch refresh with event-driven cache invalidation using database change streams or message queues

**Expected Impact**: 40-60% reduction in database load, sub-100ms API response times, and dynamic memory usage optimization.

#### **2. Microservices Decomposition & Event-Driven Architecture**

**Current State**: Monolithic architecture with 13 tightly coupled service classes handling diverse business domains within a single Spring Boot application.

**Future Initiative**: Decompose into domain-driven microservices with event sourcing:

- **Domain Service Separation**: Extract major business domains (O2C, I2C, CMS, Revenue Accounting, Period Close) into independent microservices with their own databases and caching layers
- **Event-Driven Communication**: Replace synchronous REST calls between services with asynchronous event streaming using Apache Kafka or Redis Streams for loose coupling and improved resilience
- **Shared Data Platform**: Implement a centralized data lake (using Apache Spark/Delta Lake) that aggregates data from all Oracle sources, allowing microservices to consume optimized, pre-processed datasets rather than direct database queries
- **API Gateway & Service Mesh**: Introduce Kong/Istio for centralized authentication, rate limiting, and inter-service communication with automatic load balancing and circuit breakers
- **Containerized Deployment**: Migrate to Kubernetes-native deployment with auto-scaling based on CPU/memory usage and request volume, enabling independent scaling of high-traffic services (e.g., CMS monitoring during period close)

**Expected Impact**: Independent service scaling, fault isolation, 90% reduction in cross-service dependencies, and ability to handle 10x current transaction volume during peak periods.

**Implementation Priority**: Start with Cache Optimization (3-month timeline) as it provides immediate performance gains with minimal architectural disruption, followed by gradual microservices migration (12-18 month timeline) beginning with the most isolated domains like WebexMessaging and EspCaseManager services.

#### **3. Dynamic Query Registration & Code Generation**

**Current State**: Adding a new database query requires manual changes across 6 files and 8+ edit points (env.json, queries.properties, QueryConfigs.java, Service class, Controller class, and Angular frontend), creating significant developer friction and potential for human error.

**Future Initiative**: Implement an annotation-driven query framework with automatic code generation:

- **Query Annotation System**: Create `@DatabaseQuery` annotations that can be placed directly on service methods, eliminating the need for separate query configuration files
- **Runtime Code Generation**: Use Spring's reflection capabilities and annotation processing to automatically generate query beans, controller endpoints, and service methods at application startup
- **Convention-over-Configuration**: Establish naming conventions where `@DatabaseQuery("SELECT * FROM orders")` on a method automatically creates `/api/orders` endpoint with proper caching and error handling
- **Hot-Reload Query Updates**: Enable query modifications without full application restart by implementing a `/admin/reload-queries` endpoint for development environments

**Example Implementation**:

```java
@Service
public class OrderService {
    @DatabaseQuery(value = "SELECT * FROM orders WHERE status = ?", endpoint = "/orders-by-status")
    @Cacheable(duration = "30m")
    public List<OrderModel> getOrdersByStatus(String status) {
        // Method body auto-generated at runtime
    }
}
```

**Expected Impact**: 90% reduction in manual code changes for new queries (from 6 files to 1 annotation), elimination of configuration drift, and faster feature development cycles.

#### **4. Embedded Python Analytics Engine**

**Current State**: Data engineering team runs Python analysis separately, manually enters results into Oracle, which the Java backend then fetches - creating a disconnected, manual workflow with potential data consistency issues.

**Future Initiative**: Integrate Python execution engine directly into the Java backend for seamless analytics workflows:

- **Python-Java Bridge**: Implement GraalVM's Python support or use Jython/Py4J to execute Python scripts directly within the Java application context
- **Shared Data Context**: Provide Python scripts direct access to the same Oracle connections and Redis cache that Java services use, eliminating manual data entry steps
- **Endpoint Auto-Generation**: Create a framework where Python functions decorated with `@api_endpoint` automatically become REST endpoints accessible to the Angular frontend
- **Scheduled Python Jobs**: Extend the existing CacheRefresh scheduler to run Python analytics scripts and cache their results for frontend consumption
- **Development Workflow**: Enable data scientists to deploy Python scripts via a simple `/admin/deploy-script` endpoint without requiring Java development knowledge

**Example Implementation**:

```python
# File: analytics/wd0_forecasting.py
@api_endpoint("/api/wd0-forecast")
@cache_duration("2h")
def get_wd0_forecast(period: str) -> Dict:
    # Python analytics logic here
    df = fetch_oracle_data("SELECT * FROM wd0_data")
    forecast = run_ml_model(df, period)
    return forecast.to_dict()
```

**Expected Impact**: Eliminate manual data entry workflows, reduce analytics-to-frontend time from days to minutes, and enable data scientists to directly serve insights to business users without Java development bottlenecks.

**Implementation Approach**:

1. **Query Framework** (2-month timeline): Immediate developer productivity gains with minimal risk
2. **Python Integration** (4-month timeline): High impact for data science workflows, moderate complexity
3. Both initiatives can be developed in parallel and provide immediate value independent of the larger microservices migration

### **Appendix A**

A complete overview of all project files.

```
revenue-monitoring-server/
├── src/main/java/com/cisco/des/o2c/rev/revenuemonitoringserver/
│   ├── RevenueMonitoringServerApplication.java    # Main Spring Boot Application Entry Point
│   ├── configs/                                   # Configuration & Setup Classes
│   │   ├── CacheConfig.java                       # Cache refresh interval configurations
│   │   ├── CorsConfig.java                        # Cross-Origin Resource Sharing setup
│   │   ├── DataSourceConfig.java                  # Database connection & HikariCP setup
│   │   ├── QueryConfigs.java                      # SQL query bean configurations
│   │   ├── RedisConfig.java                       # Redis caching configuration
│   │   └── WebexConfig.java                       # Webex Teams messaging configuration
│   ├── controllers/                               # REST API Endpoints (13 controllers)
│   │   ├── BusinessInsightsMonitoringController.java
│   │   ├── CMSMonitoringController.java           # Customer Management System endpoints
│   │   ├── CommonController.java                  # Shared utility endpoints
│   │   ├── EspCaseManagerController.java          # ESP case management endpoints
│   │   ├── GlPostingMonitoringController.java     # General Ledger posting monitoring
│   │   ├── InvoiceToCashMonitoringController.java # Invoice-to-Cash process monitoring
│   │   ├── O2CMonitoringController.java           # Order-to-Cash monitoring
│   │   ├── OperationsControlsController.java      # Operations control endpoints
│   │   ├── OrderManagementMonitoringController.java
│   │   ├── PeriodCloseMonitoringController.java   # Period close tracking
│   │   ├── PostInvoicingMonitoringController.java # Post-invoicing process monitoring
│   │   ├── RevenueAccountingMonitoringController.java
│   │   └── WebexMessageController.java            # Webex Teams notification endpoints
│   ├── services/                                  # Business Logic Layer (13 services)
│   │   ├── BusinessInsightsMonitoringService.java
│   │   ├── CMSMonitoringService.java              # CMS data processing & caching
│   │   ├── CommonService.java                     # Shared business logic
│   │   ├── EspCaseManagerService.java             # ESP case management logic
│   │   ├── GLPostingMonitoringService.java        # GL posting data processing
│   │   ├── InvoiceToCashMonitoringService.java    # I2C process data handling
│   │   ├── O2CMonitoringService.java              # O2C process monitoring logic
│   │   ├── OperationsControlsService.java         # Operations control business logic
│   │   ├── OrderManagementMonitoringService.java  # Order lifecycle monitoring
│   │   ├── PeriodCloseMonitoringService.java      # Period close tracking logic
│   │   ├── PostInvoicingMonitoringService.java    # Post-invoicing data processing
│   │   ├── RevenueAccountingMonitoringService.java # Revenue accounting logic
│   │   └── WebexMessagingService.java             # Webex Teams messaging logic
│   ├── utils/                                     # Utility & Helper Classes
│   │   ├── CacheCommon.java                       # Redis cache management utilities
│   │   ├── Common.java                            # General utility functions
│   │   ├── ExcelReader.java                       # Excel file processing utilities
│   │   ├── JdbcManager.java                       # Database query execution manager
│   │   └── MongoDBManager.java                    # MongoDB connection & operations
│   ├── repository/                                # Data Access Layer
│   │   ├── RedisRepository.java                   # Redis repository interface
│   │   └── RedisRepositoryImpl.java               # Redis operations implementation
│   ├── models/                                    # Data Transfer Objects
│   │   ├── ErrorSummaryModel.java                 # Error summary data model
│   │   ├── LargeDealSummaryByAccountModel.java    # Large deal tracking model
│   │   ├── MessageRequestModel.java               # Webex message request model
│   │   ├── OrderLifecycleModel.java               # Order lifecycle data model
│   │   ├── OrderLifecycleSummaryModel.java        # Order lifecycle summary model
│   │   ├── UpdateCLOData.java                     # CLO update data model
│   │   ├── UpdateOrderModel.java                  # Order update data model
│   │   └── UserRoleInfo.java                      # User role information model
│   ├── scheduler/                                 # Background Job Scheduling
│   │   └── CacheRefresh.java                      # Automated cache refresh scheduler
│   └── queue/                                     # Message Queue Implementation
│       ├── MessagePublisher.java                  # Redis pub/sub publisher interface
│       ├── MessagePublisherImpl.java              # Redis pub/sub publisher implementation
│       └── MessageSubscriber.java                 # Redis message subscriber
└── src/main/resources/
    ├── application.properties                     # Application configuration
    ├── cacheStrategy.properties                   # Cache refresh timing configuration
    └── queries.properties                         # SQL query definitions
```
