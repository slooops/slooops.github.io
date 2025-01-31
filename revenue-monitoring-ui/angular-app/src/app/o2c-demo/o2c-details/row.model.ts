export interface Row {
  id: string;
  text1: string;
  text2: string;
  children?: Row[];
}

export const ROWS: Row[] = [
  {
    id: '1',
    text1: 'text 1.1',
    text2: 'text 1.2',
  },
  {
    id: '2',
    text1: 'text 2.1',
    text2: 'text 2.2',
    children: [
      {
        id: '2.1',
        text1: 'text 2.1.1',
        text2: 'text 2.1.2',
      },
      {
        id: '2.2',
        text1: 'text 2.2.1',
        text2: 'text 2.2.2',
      },
    ],
  },
  {
    id: '3',
    text1: 'text 3.1',
    text2: 'text 3.2',
  },
  {
    id: '4',
    text1: 'text 4.1',
    text2: 'text 4.2',
    children: [
      {
        id: '4.1',
        text1: 'text 4.1.1',
        text2: 'text 4.1.2',
      },
      {
        id: '4.2',
        text1: 'text 4.2.1',
        text2: 'text 4.2.2',
      },
    ],
  },
];
