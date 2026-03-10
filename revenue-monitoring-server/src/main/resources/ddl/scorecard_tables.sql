-- ============================================================================
-- Sprint Scorecard & Executive Summary — Oracle DDL
-- ============================================================================
-- 5 tables:
--   1. SCORECARD_VERSION        – version metadata (who saved, when, sprint name)
--   2. SCORECARD_DATA           – row data per version
--   3. EXEC_SUMMARY_VERSION     – version metadata for SDLC executive summary
--   4. EXEC_SUMMARY_DATA        – row data per version
--   5. SCORECARD_EDITORS        – authorization allowlist
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. SCORECARD_VERSION
-- --------------------------------------------------------------------------
CREATE SEQUENCE SCORECARD_VERSION_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE SCORECARD_VERSION (
    VERSION_ID   NUMBER        DEFAULT SCORECARD_VERSION_SEQ.NEXTVAL PRIMARY KEY,
    SPRINT_NAME  VARCHAR2(200) NOT NULL,
    CREATED_BY   VARCHAR2(100) NOT NULL,
    CREATED_AT   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    NOTES        VARCHAR2(500)
);

CREATE INDEX IDX_SC_VERSION_CREATED ON SCORECARD_VERSION (CREATED_AT DESC);


-- --------------------------------------------------------------------------
-- 2. SCORECARD_DATA
-- --------------------------------------------------------------------------
CREATE SEQUENCE SCORECARD_DATA_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE SCORECARD_DATA (
    DATA_ID          NUMBER        DEFAULT SCORECARD_DATA_SEQ.NEXTVAL PRIMARY KEY,
    VERSION_ID       NUMBER        NOT NULL REFERENCES SCORECARD_VERSION (VERSION_ID),
    WORKSTREAM       VARCHAR2(200) NOT NULL,
    SUCCESS_CRITERIA VARCHAR2(500),
    BASELINE         VARCHAR2(200),
    OWNERS           VARCHAR2(200),
    EOCY26_TARGET    VARCHAR2(200),
    HOW_WE_MEASURE   VARCHAR2(500),
    METRIC           VARCHAR2(500),
    SORT_ORDER       NUMBER        NOT NULL
);

CREATE INDEX IDX_SC_DATA_VERSION ON SCORECARD_DATA (VERSION_ID);


-- --------------------------------------------------------------------------
-- 3. EXEC_SUMMARY_VERSION
-- --------------------------------------------------------------------------
CREATE SEQUENCE EXEC_SUMMARY_VERSION_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE EXEC_SUMMARY_VERSION (
    VERSION_ID   NUMBER        DEFAULT EXEC_SUMMARY_VERSION_SEQ.NEXTVAL PRIMARY KEY,
    SPRINT_NAME  VARCHAR2(200) NOT NULL,
    CREATED_BY   VARCHAR2(100) NOT NULL,
    CREATED_AT   TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    NOTES        VARCHAR2(500)
);

CREATE INDEX IDX_ES_VERSION_CREATED ON EXEC_SUMMARY_VERSION (CREATED_AT DESC);


-- --------------------------------------------------------------------------
-- 4. EXEC_SUMMARY_DATA
-- --------------------------------------------------------------------------
CREATE SEQUENCE EXEC_SUMMARY_DATA_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE EXEC_SUMMARY_DATA (
    DATA_ID      NUMBER        DEFAULT EXEC_SUMMARY_DATA_SEQ.NEXTVAL PRIMARY KEY,
    VERSION_ID   NUMBER        NOT NULL REFERENCES EXEC_SUMMARY_VERSION (VERSION_ID),
    SDLC_TRACK   VARCHAR2(200) NOT NULL,
    HIGHLIGHTS   CLOB,
    WATCH_AREAS  CLOB,
    SORT_ORDER   NUMBER        NOT NULL
);

CREATE INDEX IDX_ES_DATA_VERSION ON EXEC_SUMMARY_DATA (VERSION_ID);


-- --------------------------------------------------------------------------
-- 5. SCORECARD_EDITORS  (shared across both tables)
-- --------------------------------------------------------------------------
CREATE SEQUENCE SCORECARD_EDITORS_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE SCORECARD_EDITORS (
    EDITOR_ID    NUMBER        DEFAULT SCORECARD_EDITORS_SEQ.NEXTVAL PRIMARY KEY,
    CEC_USERNAME VARCHAR2(100) NOT NULL,
    DISPLAY_NAME VARCHAR2(200) NOT NULL,
    ROLE_LEVEL   VARCHAR2(20)  NOT NULL,   -- 'ADMIN' or 'OWNER'
    TABLE_SCOPE  VARCHAR2(20)  NOT NULL,   -- 'SCORECARD', 'EXEC_SUMMARY', or 'ALL'
    ENABLED_FLAG VARCHAR2(1)   DEFAULT 'Y' NOT NULL,
    CONSTRAINT CHK_ROLE_LEVEL  CHECK (ROLE_LEVEL  IN ('ADMIN', 'OWNER')),
    CONSTRAINT CHK_TABLE_SCOPE CHECK (TABLE_SCOPE IN ('SCORECARD', 'EXEC_SUMMARY', 'ALL')),
    CONSTRAINT CHK_ENABLED     CHECK (ENABLED_FLAG IN ('Y', 'N')),
    CONSTRAINT UQ_EDITOR_SCOPE UNIQUE (CEC_USERNAME, TABLE_SCOPE)
);


-- ============================================================================
-- SEED DATA — Scorecard Editors (known CECs)
-- ============================================================================

INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('ngopalan', 'Nirmala Gopalan',    'ADMIN', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('gbhakta',  'Geetha Bhakta',      'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('raappann', 'Raghu Appannagari',  'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('rjalapat', 'Raghu Jalapati',     'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('ssreepat', 'Sai Sreepathi',      'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('sujoshi',  'Sujata Joshi',       'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('apillai',  'Ajith Pillai',       'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('vgurumoo', 'Vidhya Gurumoorthy', 'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('asnigam',  'Ashish Nigam',       'OWNER', 'ALL');
INSERT INTO SCORECARD_EDITORS (CEC_USERNAME, DISPLAY_NAME, ROLE_LEVEL, TABLE_SCOPE) VALUES ('sgunda',   'Srini Gunda',        'OWNER', 'ALL');


-- ============================================================================
-- SEED DATA — Scorecard Version 1 (initial state from screenshot)
-- ============================================================================

INSERT INTO SCORECARD_VERSION (SPRINT_NAME, CREATED_BY, NOTES)
VALUES ('Sprint S17', 'ngopalan', 'Initial scorecard — baseline from Monthly Performance Scorecard');

-- Workstream 1: Improve Cycle time
INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '1. Improve Cycle time',
    'Fewer cycles to establish comprehensive business requirements and solution design',
    '3 Sprints', 'Geetha (Ashish)', '2 Sprints',
    'Cycle time for Jira Features to progress from ''Discovery'' to ''In development''',
    NULL, 1);

INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '1. Improve Cycle time',
    'Optimized Build cycle time with AI Tools',
    '5 to 6', 'Sujata', 'Halve the cycle time',
    'Executive Summary dashboard',
    NULL, 2);

INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '1. Improve Cycle time',
    'Hold or better MTTR',
    '2-3 Days', 'Sai (Srini)', '30% improvement',
    'ESP (ServiceNow) metrics dashboard',
    NULL, 3);

-- Workstream 2: Improve Productivity
INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '2. Improve Productivity',
    'Accelerated E2E delivery → higher Productivity',
    '65 / Person / Qtr', 'Sujata', 'Double the throughput',
    'Value per sprint measured through Story points delivered',
    NULL, 4);

INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '2. Improve Productivity',
    'Case Avoidance and Case Reduction',
    '1750', 'Sai (Srini)', '25% reduction',
    'ESP (ServiceNow) Service Requests dashboard',
    NULL, 5);

-- Workstream 3: Improve Quality
INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '3. Improve Quality',
    'Fewer requirement/solution gaps measured across SDLC through normalization',
    'TBD', 'Geetha (Ashish)', '30% reduction',
    'Policy / requirements gap Identified during build, test and/or post-release',
    NULL, 6);

INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '3. Improve Quality',
    'Reduction in defects & bugs',
    '499 / 11K (6.37%)', 'Raghu (Venkat)', '<= 3%',
    'Engineering Dashboard (Agile WOW)',
    NULL, 7);

INSERT INTO SCORECARD_DATA (VERSION_ID, WORKSTREAM, SUCCESS_CRITERIA, BASELINE, OWNERS, EOCY26_TARGET, HOW_WE_MEASURE, METRIC, SORT_ORDER)
VALUES (SCORECARD_VERSION_SEQ.CURRVAL, '3. Improve Quality',
    'Left-shift security reduces vulnerabilities, driving cost avoidance and less rework',
    '1160', 'Vidhya (Ajith)', '95%+ Closure Rate',
    'STO dashboards',
    NULL, 8);


-- ============================================================================
-- SEED DATA — Executive Summary Version 1
-- ============================================================================

INSERT INTO EXEC_SUMMARY_VERSION (SPRINT_NAME, CREATED_BY, NOTES)
VALUES ('Sprint S17', 'ngopalan', 'Initial SDLC executive summary');

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'FinIQ Knowledge Hub',
    '• Starting March 9th, a metrics dashboard will track the completeness of business and IT content and documentation.' || CHR(10) ||
    '• The CodeReef pilot (focused on Revenue Accruals) had successfully generated feature descriptions from code, with further iterations underway.' || CHR(10) ||
    '• Efforts are being made to enhance the Product Catalog Repository by incorporating well-defined use cases for each capability and feature for consumption across SDLC stages',
    NULL, 1);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Requirement Authoring',
    '• Initiated Requirement Authoring Agent for Germany e-Invoicing and ICMS blind discount automation as Pilot use cases.',
    '• Scale deployment of requirement authoring and validation agents.', 2);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Requirement Validation',
    '• 23 of 26 (88%) Commerce and Buying Programs PLT capabilities for May/Jun releases will be validated through PRIMA',
    NULL, 3);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Solution Design',
    '• 15 of 24 (62%) Commerce and Buying Programs PLT capabilities for May/Jun releases will leverage AnA agent for solution design generation',
    '• Getting all components to start adopting AnA for ''ALL'' Solution Designs.', 4);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Build',
    '• 100% CoPilot adoption' || CHR(10) ||
    '• 72% Shredder plugins enabled (highlight vulnerabilities during build)' || CHR(10) ||
    '• 85% Repos enabled with Dependabot (highlights library vulnerabilities)',
    NULL, 5);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Test',
    '• Environmental defects have decreased by 33% following the implementation of the automation framework.',
    '• Linking Product Catalog and Test Case Repo' || CHR(10) ||
    '• Finalize partnerships and processes for Zephyr integration', 6);

INSERT INTO EXEC_SUMMARY_DATA (VERSION_ID, SDLC_TRACK, HIGHLIGHTS, WATCH_AREAS, SORT_ORDER)
VALUES (EXEC_SUMMARY_VERSION_SEQ.CURRVAL, 'Support',
    '• 73/80 resolution agents deployed for CaseIQ; Dashboard available March 4th',
    '• Complete deployment of resolution agents and monitor adoption and accuracy metrics.', 7);

COMMIT;
