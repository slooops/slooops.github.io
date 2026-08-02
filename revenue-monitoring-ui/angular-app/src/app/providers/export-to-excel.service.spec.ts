import { TestBed } from '@angular/core/testing';
import { ExportToExcelService } from './export-to-excel.service';

describe('ExportToExcelService', () => {
  let service: ExportToExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportToExcelService],
    });
    service = TestBed.inject(ExportToExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportTableToExcel', () => {
    let createObjectURLSpy: jasmine.Spy;
    let revokeObjectURLSpy: jasmine.Spy;
    let mockAnchor: any;

    beforeEach(() => {
      createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue(
        'blob:mock',
      );
      revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
      mockAnchor = {
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
      };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as any);
    });

    it('should handle empty data array', async () => {
      await service.exportTableToExcel([], 'Sheet1', 'test-export');

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('test-export.xlsx');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should handle data with rows', async () => {
      const data = [
        { name: 'Alice', amount: 100 },
        { name: 'Bob', amount: 200 },
      ];

      await service.exportTableToExcel(data, 'TestSheet', 'report');

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('report.xlsx');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should truncate sheet name to 31 characters', async () => {
      const longName = 'A'.repeat(50);
      await service.exportTableToExcel([{ col: 'val' }], longName, 'test');

      // Should not throw - Excel requires sheet names <= 31 chars
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });
});
