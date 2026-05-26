import { TestBed } from '@angular/core/testing';
import { FiltersService } from './filters.service';

describe('FiltersService', () => {
  let service: FiltersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FiltersService],
    });
    service = TestBed.inject(FiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('applyFilters', () => {
    const sampleData = [
      { NAME: 'Alice', STATUS: 'Active', AMOUNT: '$1,500.00' },
      { NAME: 'Bob', STATUS: 'Inactive', AMOUNT: '$2,300.50' },
      { NAME: 'Charlie', STATUS: 'Active', AMOUNT: '$800.00' },
      { NAME: 'Diana', STATUS: 'Pending', AMOUNT: '$3,100.00' },
    ];

    it('should return all data when no filters applied', () => {
      const result = service.applyFilters(sampleData, {});
      expect(result.length).toBe(4);
    });

    it('should return all data when filter is "all"', () => {
      const result = service.applyFilters(sampleData, { STATUS: 'all' });
      expect(result.length).toBe(4);
    });

    it('should return all data when filter is empty string', () => {
      const result = service.applyFilters(sampleData, { STATUS: '' });
      expect(result.length).toBe(4);
    });

    it('should filter by string value (case-insensitive)', () => {
      const result = service.applyFilters(sampleData, { STATUS: 'active' });
      // 'active' matches 'Active' and 'Inactive' (contains 'active')
      expect(result.length).toBe(3);
      expect(result[0]['NAME']).toBe('Alice');
      expect(result[1]['NAME']).toBe('Bob');
      expect(result[2]['NAME']).toBe('Charlie');
    });

    it('should filter by partial string match', () => {
      const result = service.applyFilters(sampleData, { NAME: 'li' });
      expect(result.length).toBe(2); // Alice, Charlie
    });

    it('should handle numeric AMOUNT filter with "greater"', () => {
      const result = service.applyFilters(sampleData, {
        AMOUNT: 'greater than 2000',
      });
      expect(result.length).toBe(2); // Bob ($2,300.50), Diana ($3,100.00)
    });

    it('should handle numeric AMOUNT filter with "less"', () => {
      const result = service.applyFilters(sampleData, {
        AMOUNT: 'less than 1000',
      });
      expect(result.length).toBe(1); // Charlie ($800.00)
    });

    it('should handle numeric AMOUNT filter with "equal"', () => {
      const result = service.applyFilters(sampleData, {
        AMOUNT: 'equal 800',
      });
      expect(result.length).toBe(1); // Charlie
    });

    it('should apply multiple filters simultaneously', () => {
      const result = service.applyFilters(sampleData, {
        STATUS: 'Active',
        NAME: 'Alice',
      });
      expect(result.length).toBe(1);
      expect(result[0]['NAME']).toBe('Alice');
    });

    it('should return empty array when no data matches', () => {
      const result = service.applyFilters(sampleData, {
        STATUS: 'NonExistent',
      });
      expect(result.length).toBe(0);
    });

    it('should not mutate original data', () => {
      const originalLength = sampleData.length;
      service.applyFilters(sampleData, { STATUS: 'Active' });
      expect(sampleData.length).toBe(originalLength);
    });

    it('should handle empty data array', () => {
      const result = service.applyFilters([], { STATUS: 'Active' });
      expect(result.length).toBe(0);
    });

    it('should handle null column values gracefully', () => {
      const dataWithNulls = [
        { NAME: 'Alice', STATUS: null },
        { NAME: 'Bob', STATUS: 'Active' },
      ];
      const result = service.applyFilters(dataWithNulls, { STATUS: 'Active' });
      expect(result.length).toBe(1);
      expect(result[0]['NAME']).toBe('Bob');
    });

    it('should handle numeric amount without dollar sign', () => {
      const numericData = [
        { NAME: 'Alice', AMOUNT: 1500 },
        { NAME: 'Bob', AMOUNT: 500 },
      ];
      const result = service.applyFilters(numericData, {
        AMOUNT: 'greater than 1000',
      });
      expect(result.length).toBe(1);
      expect(result[0]['NAME']).toBe('Alice');
    });
  });
});
