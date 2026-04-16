import { Report } from '../models/index.js';
import { generateReport, generateExcelBuffer } from '../services/report.service.js';
import { ApiError } from '../utils/ApiError.js';

export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.findAll({
      include: [{ association: 'generatedByUser', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, data: { reports } });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const { type, format = 'excel' } = req.body;
    if (!['inventory', 'sales', 'purchases', 'alerts'].includes(type)) {
      throw ApiError.badRequest('Invalid report type');
    }

    const reportData = await generateReport(type);

    const report = await Report.create({
      title: reportData.title,
      type,
      generatedBy: req.user.id,
      data: reportData,
      format,
    });

    res.status(201).json({ success: true, message: 'Report generated', data: { report } });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) throw ApiError.notFound('Report not found');

    const reportData = report.data || await generateReport(report.type);

    if (report.format === 'excel') {
      const buffer = generateExcelBuffer(reportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/\s/g, '_')}.xlsx"`);
      return res.send(buffer);
    }

    // JSON fallback
    res.json({ success: true, data: reportData });
  } catch (error) {
    next(error);
  }
};
