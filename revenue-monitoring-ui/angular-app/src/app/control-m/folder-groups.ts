// Folder grouping rules for the Control-M dashboard tile grid.
// Ported verbatim from i2c-control-m/frontend/src/config/folderGroups.ts
//
// 3-level hierarchy:
//   Group (e.g. "Revenue")
//     └── Process Area (e.g. "Meraki", "VIP", "CSPP")
//            └── Control-M folders (matched by regex)

export interface ProcessArea {
  id: string;
  label: string;
  match: RegExp[];
}

export interface FolderGroup {
  id: string;
  label: string;
  processAreas: ProcessArea[];
}

export const FOLDER_GROUPS: FolderGroup[] = [
  {
    id: '__group__revenue',
    label: 'Revenue',
    processAreas: [
      { id: 'meraki', label: 'Meraki', match: [/^Meraki/i, /REVMER/i] },
      {
        id: 'revenue_accrual',
        label: 'Revenue Accrual',
        match: [/Revenue[\s_-]?Accrual/i],
      },
      { id: 'vip', label: 'VIP', match: [/^VIP[_\s-]/i] },
      { id: 'cspp', label: 'CSPP', match: [/^CSPP[_\s-]/i] },
      { id: 'cpi', label: 'CPI', match: [/^CPI[_\s-]/i] },
      { id: 'ela_ib', label: 'ELA IB', match: [/ELA[\s_-]?IB/i] },
      {
        id: 'divesture',
        label: 'Divesture',
        match: [/Divesture/i, /Divestiture/i, /Divset/i],
      },
      {
        id: 'netaccounting',
        label: 'NetAccounting',
        match: [/NET[\s_-]?ACCT/i, /NETACCT/i],
      },
      { id: 'nrs_accounting', label: 'NRS Accounting', match: [/^NRS/i] },
      { id: 'rrr', label: 'RRR', match: [/^MU[\s_-]?FBLMU/i] },
      {
        id: 'rev_opl_global',
        label: 'Rev OPL Global',
        match: [
          /REV[\s_-]?OPL[\s_-]?G(BL|LOBAL|L)/i,
          /RV[\s_-]?OPL[\s_-]?G(BL|LOBAL|L)/i,
        ],
      },
      {
        id: 'swiss_revenue',
        label: 'Swiss Revenue',
        match: [/REV[\s_-]?SWSS/i, /SWSS[\s_-]?REV/i, /SWISS[\s_-]?REV/i],
      },
      {
        id: 'rol_notification',
        label: 'ROL Notification',
        match: [/ROL[\s_-]?Notification/i, /ROL[\s_-]?NOTIF/i],
      },
      {
        id: 'revenue_attribution',
        label: 'Revenue Attribution',
        match: [
          /Revenue[\s_-]?Attribution/i,
          /Rev[\s_-]?Attribution/i,
          /REVATTR/i,
        ],
      },
    ],
  },
  {
    id: '__group__additional_ai',
    label: 'Additional AI',
    processAreas: [
      {
        id: 'br_addl_ai',
        label: 'BR Additional AI',
        match: [/^BR[\s_-]?Add(itional|nl)?[\s_-]?AI/i],
      },
      {
        id: 'india_addl_ai',
        label: 'India Additional AI',
        match: [/^India[\s_-]?Add(itional|nl)?[\s_-]?AI/i],
      },
      {
        id: 'korea_addl_ai',
        label: 'Korea Additional AI',
        match: [/^Korea[\s_-]?Add(itional|nl)?[\s_-]?AI/i],
      },
      {
        id: 'other_addl_ai',
        label: 'Other Additional AI',
        match: [/Add(itional|tional|nl)?[\s_-]?AI/i, /ADDNLAI/i],
      },
    ],
  },
  {
    id: '__group__credit_check',
    label: 'Credit Check Process',
    processAreas: [
      { id: 'edi_845', label: 'EDI 845', match: [/^EDI[\s_-]?845/i] },
      {
        id: 'credit_exposure',
        label: 'Credit Exposure',
        match: [/^Stand[\s_-]?Alone/i],
      },
    ],
  },
  {
    id: '__group__cyclic',
    label: 'Cyclic Job',
    processAreas: [
      { id: 'independent', label: 'Independent', match: [/^Independent/i] },
      {
        id: 'xaas_cg1',
        label: 'Xaas CG1',
        match: [/^XAAS[\s_-]?CXEA/i, /^CXEA[\s_-]?CG1/i],
      },
      {
        id: 'xaas_printing',
        label: 'Xaas Printing',
        match: [/^Xaas[\s_-]?Printing/i],
      },
    ],
  },
  {
    id: '__group__cash_collection',
    label: 'Cash and Collection',
    processAreas: [
      { id: 'cms', label: 'CMS', match: [/^CMS/i] },
      {
        id: 'digital_payment_recon',
        label: 'Digital Payment Recon',
        match: [/^DIGITAL[\s_-]?PMT[\s_-]?RECON/i],
      },
      {
        id: 'remittance_advise',
        label: 'Remittance Advise',
        match: [/^CGREMAD/i],
      },
      { id: 'icms_cg1_sync', label: 'ICMS-CG1 Sync up', match: [/^ICMS/i] },
      {
        id: 'zuora_payments',
        label: 'Zuora Payments',
        match: [/^ZUORA[\s_-]?PAYMENTS/i],
      },
      {
        id: 'xaas_process_payment',
        label: 'Xaas Process Payments',
        match: [/^XAAS[\s_-]?Process[\s_-]?Payment/i],
      },
    ],
  },
  {
    id: '__group__china_localization',
    label: 'China Localization',
    processAreas: [
      { id: 'china', label: 'China', match: [/^China$/i] },
      { id: 'panyu', label: 'Panyu', match: [/^Panyu$/i] },
    ],
  },
  {
    id: '__group__fusion',
    label: 'Fusion',
    processAreas: [
      {
        id: 'fusion_storage',
        label: 'Fusion Storage (eInvoice Upload)',
        match: [/^FUSION[\s_-]?TS[\s_-]?STORAGE/i],
      },
      {
        id: 'soa_jobs',
        label: 'SOA Jobs (Fusion Order Import)',
        match: [/^SOA[\s_-]?Jobs/i],
      },
      {
        id: 'malaysia_einvoicing',
        label: 'Malaysia eInvoicing',
        match: [/^MY[\s_-]?E[\s_-]?INVOICING/i],
      },
      {
        id: 'fusion_wrapper_einvoicing',
        label: 'Fusion Wrapper eInvoicing',
        match: [/FUSION[\s_-]?WRAPPER[\s_-]?E?[\s_-]?INVOIC/i],
      },
    ],
  },
  {
    id: '__group__env_refresh',
    label: 'Environment Refresh',
    processAreas: [
      { id: 'gbldly', label: 'GBLDLY', match: [/^GBLDLY/i] },
      { id: 'maintenance', label: 'Maintenance', match: [/^Maintenance/i] },
    ],
  },
];

// Folders to hide from the dashboard entirely.
export const HIDE_PATTERNS: RegExp[] = [/^RUS/i];
