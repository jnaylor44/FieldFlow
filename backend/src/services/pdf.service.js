const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class PDFService {
  constructor() {
    handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });
    
    handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    });
    handlebars.registerHelper('lookup', function(obj, key) {
      return obj && obj[key];
    });
  }

  async generateReportPDF(report) {
    let browser = null;
    try {
      const templatePath = path.resolve(__dirname, '../templates/report.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      let logoSrc = null;
      if (report.report_content && report.report_content.logo) {
        const logo = report.report_content.logo;
        
        if (typeof logo === 'string') {
          const isSvg = logo.includes('<svg') || 
                        logo.includes('image/svg+xml') ||
                        (logo.startsWith('data:') && logo.includes('svg'));
          
          if (isSvg) {
            if (logo.startsWith('data:image/svg+xml;base64,')) {
              logoSrc = logo;
            } else if (logo.startsWith('data:')) {
              const base64Data = logo.replace(/^data:.*?;base64,/, '');
              logoSrc = `data:image/svg+xml;base64,${base64Data}`;
            } else if (logo.startsWith('<svg')) {
              const base64Data = Buffer.from(logo).toString('base64');
              logoSrc = `data:image/svg+xml;base64,${base64Data}`;
            } else {
              logoSrc = `data:image/svg+xml;base64,${logo}`;
            }
          } else {
            if (logo.startsWith('data:image/')) {
              logoSrc = logo;
            } else {
              logoSrc = `data:image/png;base64,${logo.replace(/^data:image\/[^;]+;base64,/, '')}`;
            }
          }
        }
      }
      const processedSections = (report.report_content.sections || []).map(section => {
        const processedSection = { ...section };
        if (section.type === 'checklist') {
          processedSection.columns = section.columns || 1;
          processedSection.summarizeSelected = section.summarizeSelected || false;
          const checklistItems = [];
          
          if (Array.isArray(section.checklistItems)) {
            section.checklistItems.forEach((itemText, index) => {
              const item = {
                text: itemText,
                checked: section.value && section.value[index] === true
              };
              if (section.value && section.value.notes && section.value.notes[index]) {
                item.note = section.value.notes[index];
              }
              
              checklistItems.push(item);
            });
          }
          processedSection.checklistItems = checklistItems;
        }
        
        return processedSection;
      });
      const templateData = {
        reportNumber: report.report_number,
        reportDate: new Date(report.created_at).toLocaleDateString(),
        logo: logoSrc,
        businessName: "FieldFlow",
        customer: report.report_content.customer || {},
        job: report.report_content.job || {},
        sections: processedSections
      };
      const html = template(templateData);
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      await page.setViewport({
        width: 1024,
        height: 1600,
        deviceScaleFactor: 2
      });
      await page.setContent(html, { 
        waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
        timeout: 30000
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });
      
      await browser.close();
      browser = null;
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    } finally {
      if (browser !== null) {
        await browser.close().catch(console.error);
      }
    }
  }
  
  async savePDF(pdfBuffer, reportId) {
    try {
      const uploadsDir = path.resolve(__dirname, '../../uploads/reports');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `report_${reportId}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);
      
      return {
        filename,
        filePath,
        url: `/uploads/reports/${filename}`
      };
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF: ' + error.message);
    }
  }
}

module.exports = new PDFService();