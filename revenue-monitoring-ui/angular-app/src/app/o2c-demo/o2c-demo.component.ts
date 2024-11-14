import {
  Component,
  ViewChild,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';

@Component({
  selector: 'app-o2c-demo',
  templateUrl: './o2c-demo.component.html',
  styleUrl: './o2c-demo.component.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class O2cDemoComponent {
  @ViewChild('outerSort', { static: true }) sort: MatSort;
  @ViewChildren('innerSort') innerSort: QueryList<MatSort>;
  @ViewChildren('innerTables') innerTables: QueryList<MatTable<Address>>;

  data: User[] = USERS;

  dataSource: MatTableDataSource<User>;
  usersData: User[] = [];
  columnsToDisplay = [
    'common_attribute_between_all_tables_1',
    'common_attribute_between_all_tables_2',
    'common_attribute_between_all_tables_3',
  ];
  innerDisplayedColumns = ['Order_Summary', 'Order_ID', 'Order_Status'];
  innerInnerDisplayedColumns = ['comment', 'commentStatus'];
  expandedElement: User | null;
  expandedElements: any[] = [];

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    USERS.forEach((user) => {
      if (
        user.addresses &&
        Array.isArray(user.addresses) &&
        user.addresses.length
      ) {
        this.usersData = [
          ...this.usersData,
          { ...user, addresses: new MatTableDataSource(user.addresses) },
        ];
      } else {
        this.usersData = [...this.usersData, user];
      }
    });
    this.dataSource = new MatTableDataSource(this.usersData);
    this.dataSource.sort = this.sort;
  }

  applyFilter(filterValue: string) {
    this.innerTables.forEach(
      (table, index) =>
        ((table.dataSource as MatTableDataSource<Address>).filter = filterValue
          .trim()
          .toLowerCase())
    );
  }

  toggleRow(element: User) {
    element.addresses &&
    (element.addresses as MatTableDataSource<Address>).data.length
      ? this.toggleElement(element)
      : null;
    this.cd.detectChanges();
    this.innerTables.forEach(
      (table, index) =>
        ((table.dataSource as MatTableDataSource<Address>).sort =
          this.innerSort.toArray()[index])
    );
  }

  isExpanded(row: User): string {
    const index = this.expandedElements.findIndex(
      (x) =>
        x.common_attribute_between_all_tables_1 ==
        row.common_attribute_between_all_tables_1
    );
    if (index !== -1) {
      return 'expanded';
    }
    return 'collapsed';
  }

  toggleElement(row: User) {
    const index = this.expandedElements.findIndex(
      (x) =>
        x.common_attribute_between_all_tables_1 ==
        row.common_attribute_between_all_tables_1
    );
    if (index === -1) {
      this.expandedElements.push(row);
    } else {
      this.expandedElements.splice(index, 1);
    }

    //console.log(this.expandedElements);
  }
}

export interface User {
  common_attribute_between_all_tables_1: string;
  common_attribute_between_all_tables_2: string;
  common_attribute_between_all_tables_3: string;
  addresses?: Address[] | MatTableDataSource<Address>;
}

export interface Comment {
  commenID: number;
  comment: string;
  commentStatus: string;
}

export interface Address {
  Order_Summary: string;
  Order_ID: string;
  Order_Status: string;
  comments?: Comment[] | MatTableDataSource<Comment>;
}

const USERS: User[] = [
  {
    common_attribute_between_all_tables_1: 'Order',
    common_attribute_between_all_tables_2: 'cisco@test.com',
    common_attribute_between_all_tables_3: '9864785214',
    addresses: [
      {
        Order_Summary: 'Order Summary 1',
        Order_ID: '78542',
        Order_Status: 'Kansas',
        comments: [
          {
            commenID: 1,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 2,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 3,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order Summary 2',
        Order_ID: '78554',
        Order_Status: 'Texas',
        comments: [
          {
            commenID: 4,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 5,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 6,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
  {
    common_attribute_between_all_tables_1: 'Subscription',
    common_attribute_between_all_tables_2: 'deloitte@test.com',
    common_attribute_between_all_tables_3: '8786541234',
    addresses: [
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Utah',
        comments: [
          {
            commenID: 7,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 8,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 9,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Ohio',
        comments: [
          {
            commenID: 19,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 11,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 12,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
  {
    common_attribute_between_all_tables_1: 'Invoice',
    common_attribute_between_all_tables_2: 'happyHolidays@test.com',
    common_attribute_between_all_tables_3: '7856452187',
    addresses: [
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Utah',
        comments: [
          {
            commenID: 13,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 14,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 15,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
      {
        Order_Summary: 'Order_Summary 5',
        Order_ID: '23547',
        Order_Status: 'Ohio',
        comments: [
          {
            commenID: 16,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 17,
            comment: 'Test',
            commentStatus: 'Open',
          },
          {
            commenID: 18,
            comment: 'Test',
            commentStatus: 'Closed',
          },
        ],
      },
    ],
  },
];
