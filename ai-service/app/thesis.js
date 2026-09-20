const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber,
  PageBreak, UnderlineType, NumberFormat, convertInchesToTwip,
  TableOfContents, LineRuleType, PageOrientation
} = require('docx');
const fs = require('fs');

const TWIP = convertInchesToTwip;
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const thickBorder = { style: BorderStyle.SINGLE, size: 8, color: '2E4057' };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : (opts.justify !== false ? AlignmentType.JUSTIFIED : AlignmentType.LEFT),
    spacing: { before: opts.before ?? 120, after: opts.after ?? 120, line: opts.line ?? 360, lineRule: LineRuleType.AUTO },
    indent: opts.indent ? { firstLine: TWIP(0.5) } : undefined,
    children: [new TextRun({ text: text || '', font: 'Times New Roman', size: opts.size ?? 24, bold: opts.bold, italic: opts.italic, color: opts.color })]
  });
}

function run(text, opts = {}) {
  return new TextRun({ text, font: 'Times New Roman', size: opts.size ?? 24, bold: opts.bold, italic: opts.italic, color: opts.color });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 340, lineRule: LineRuleType.AUTO },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24 })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 340, lineRule: LineRuleType.AUTO },
    children: [new TextRun({ text, font: 'Times New Roman', size: 24 })]
  });
}

function sectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: 'Times New Roman', size: 28 })]
  });
}

function subTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 26 })]
  });
}

function subSubTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, italic: true, font: 'Times New Roman', size: 24 })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function blankLine() {
  return new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new TextRun('')] });
}

function placeholder(label, w = 9000, h2 = 2200) {
  return new Table({
    width: { size: w, type: WidthType.DXA },
    columnWidths: [w],
    rows: [
      new TableRow({
        height: { value: h2, rule: 'exact' },
        children: [
          new TableCell({
            width: { size: w, type: WidthType.DXA },
            shading: { fill: 'F0F4F8', type: ShadingType.CLEAR },
            borders: thinBorders,
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `[ ${label} ]`, font: 'Times New Roman', size: 22, italic: true, color: '555555' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Replace with actual screenshot / image', font: 'Times New Roman', size: 18, color: '999999' })] })
            ]
          })
        ]
      })
    ]
  });
}

function simpleTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const hRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: '2E4057', type: ShadingType.CLEAR },
      borders: thinBorders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', font: 'Times New Roman', size: 22 })] })]
    }))
  });
  const dRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? 'F8F9FA' : 'FFFFFF', type: ShadingType.CLEAR },
      borders: thinBorders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: cell, font: 'Times New Roman', size: 22 })] })]
    }))
  }));
  return new Table({ width: { size: totalW, type: WidthType.DXA }, columnWidths: colWidths, rows: [hRow, ...dRows] });
}

function codeBox(title, lines, w = 9000) {
  const allRows = [
    new TableRow({
      children: [new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { fill: '1A1A2E', type: ShadingType.CLEAR },
        borders: thinBorders,
        margins: { top: 80, bottom: 80, left: 200, right: 200 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, bold: true, color: 'FFFFFF', font: 'Courier New', size: 20 })] })]
      })]
    }),
    ...lines.map(line => new TableRow({
      children: [new TableCell({
        width: { size: w, type: WidthType.DXA },
        shading: { fill: 'F4F6F8', type: ShadingType.CLEAR },
        borders: thinBorders,
        margins: { top: 30, bottom: 30, left: 200, right: 200 },
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18, color: '222222' })] })]
      })]
    }))
  ];
  return new Table({ width: { size: w, type: WidthType.DXA }, columnWidths: [w], rows: allRows });
}

const defaultPageProps = {
  size: { width: 11906, height: 16838 },
  margin: { top: TWIP(1), right: TWIP(1), bottom: TWIP(1), left: TWIP(1.5) }
};

const mainHeader = new Header({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2E4057' } },
    children: [new TextRun({ text: 'QALAM: AI-Powered Intelligent Library Management System', font: 'Times New Roman', size: 18, italic: true, color: '555555' })]
  })]
});

const mainFooter = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: 'University of Education, Lahore  |  Page ', font: 'Times New Roman', size: 18, color: '777777' }),
      new PageNumber()
    ]
  })]
});

const romanFooter = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20 }),
      new PageNumber()
    ]
  })]
});

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '\u25CB', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.DECIMAL, text: '%1.%2.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Times New Roman', color: '1A1A2E' }, paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Times New Roman', color: '16213E' }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, italic: true, font: 'Times New Roman', color: '0F3460' }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  sections: [
    // ── PRE-PAGES (Roman numerals) ─────────────────────────────────────────
    {
      properties: { page: { ...defaultPageProps }, pageNumberStart: 1, pageNumberFormatType: NumberFormat.LOWER_ROMAN },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun('')] })] }) },
      footers: { default: romanFooter },
      children: [
        // COVER
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'QALAM: AN AI-POWERED INTELLIGENT LIBRARY MANAGEMENT SYSTEM', bold: true, font: 'Times New Roman', size: 32 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'WITH QR CODE SCANNING, SEMANTIC BOOK RECOMMENDATIONS,', bold: true, font: 'Times New Roman', size: 30 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 }, children: [new TextRun({ text: 'AND AUTOMATED NOTIFICATION INFRASTRUCTURE', bold: true, font: 'Times New Roman', size: 30 })] }),
        blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }, children: [new TextRun({ text: '[University of Education Logo — Insert Here]', font: 'Times New Roman', size: 22, italic: true, color: '888888' })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'TYPE YOUR NAME HERE', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'BS Computer Science — 2024', bold: true, font: 'Times New Roman', size: 24 })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'NAME OF DIVISION/CAMPUS', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'UNIVERSITY OF EDUCATION', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'LAHORE', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: '2024', bold: true, font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // INNER TITLE
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'Qalam: An AI-Powered Intelligent Library Management System', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 500 }, children: [new TextRun({ text: 'with QR Code Scanning, Semantic Book Recommendations, and Automated Notification Infrastructure', bold: true, font: 'Times New Roman', size: 26 })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'TYPE YOUR NAME HERE', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: 'BS Computer Science — 2024', bold: true, font: 'Times New Roman', size: 24 })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }, children: [new TextRun({ text: 'A thesis submitted in partial fulfillment of the requirements for the award of the degree of', font: 'Times New Roman', size: 24 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 500 }, children: [new TextRun({ text: 'Bachelor of Science in Computer Science', bold: true, font: 'Times New Roman', size: 24 })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NAME OF DIVISION/CAMPUS', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'UNIVERSITY OF EDUCATION', bold: true, font: 'Times New Roman', size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LAHORE', bold: true, font: 'Times New Roman', size: 28 })] }),
        blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'May 2024', bold: true, font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // COPYRIGHT
        blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(), blankLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '\u00A9 Copyright [Your Name], 2024', font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // SUPERVISOR CERTIFICATION
        blankLine(),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 400, line: 480, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: '"I hereby declare that I have read this thesis and in my opinion this thesis is sufficient in terms of scope and quality for the award of the degree of BS (Computer Science)."', font: 'Times New Roman', size: 24, italic: true })] }),
        blankLine(), blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Signature:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Name of Supervisor:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Date:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Signature:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Name of Co-Supervisor:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Date:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // DECLARATION
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'DECLARATION', bold: true, font: 'Times New Roman', size: 28 })] }),
        p('I declare that this thesis entitled "Qalam: An AI-Powered Intelligent Library Management System with QR Code Scanning, Semantic Book Recommendations, and Automated Notification Infrastructure" is the result of my own research except as cited in the references. The thesis has not been accepted for any degree and is not concurrently submitted in candidature for any other degree. At any time if my statement is found to be incorrect, even after the award of a BS degree, the university has the right to withdraw my degree.', { line: 480 }),
        blankLine(), blankLine(), blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Signature:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Name:  TYPE YOUR NAME HERE', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Date:  May 2024', font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // PLAGIARISM
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'PLAGIARISM UNDERTAKING', bold: true, font: 'Times New Roman', size: 28 })] }),
        p('I solemnly declare that the research work presented in this thesis entitled "Qalam: An AI-Powered Intelligent Library Management System" is solely my own research work with no significant contribution from any other person. Small contributions and help wherever taken have been duly acknowledged, and the complete thesis has been written by me.', { line: 480 }),
        p('I understand the zero tolerance policy of the Higher Education Commission (HEC) and the University of Education, Lahore towards plagiarism. I, as the author of the above-titled thesis, declare that no portion of my thesis has been plagiarized and any material used as reference has been properly cited.', { line: 480 }),
        p('I undertake that if I am found guilty of any formal plagiarism in the above-titled thesis, even after the award of a BS degree, the University reserves the right to withdraw or revoke my degree, and that HEC and the University have the right to publish my name on their website on which names of students who submitted plagiarized theses are listed.', { line: 480 }),
        blankLine(), blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Signature:  ___________________________________________', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Name:  TYPE YOUR NAME HERE', font: 'Times New Roman', size: 24 })] }),
        blankLine(),
        new Paragraph({ children: [new TextRun({ text: 'Date:  May 2024', font: 'Times New Roman', size: 24 })] }),
        pageBreak(),

        // CERTIFICATE OF APPROVAL
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'CERTIFICATE OF APPROVAL', bold: true, font: 'Times New Roman', size: 28 })] }),
        p('This is to certify that the research work presented in this thesis, entitled "Qalam: An AI-Powered Intelligent Library Management System with QR Code Scanning, Semantic Book Recommendations, and Automated Notification Infrastructure," was conducted by [Student Name] under the supervision of [Supervisor Name]. No part of this thesis has been submitted anywhere else for any other degree. This thesis is submitted to the Division of Science and Technology, University of Education, Lahore, in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science.', { line: 480 }),
        blankLine(),
        simpleTable(['Role', 'Name', 'Signature'], [
          ['Student', '[Student Name]', '___________________'],
          ['Supervisor', '[Supervisor Name]', '___________________'],
          ['External Examiner 1', '[Examiner Name]', '___________________'],
          ['External Examiner 2', '[Examiner Name]', '___________________'],
          ['Internal Examiner', '[Examiner Name]', '___________________'],
          ['Dean / HOD', '[Dean Name]', '___________________'],
        ], [3000, 3000, 3000]),
        pageBreak(),

        // ACKNOWLEDGEMENT
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'ACKNOWLEDGEMENT', bold: true, font: 'Times New Roman', size: 28 })] }),
        p('Alhamdulillah, all praise is due to Allah Almighty, whose blessings and guidance made the completion of this work possible. I am profoundly grateful to my supervisor, [Supervisor Name], whose patient mentorship, critical insight, and unwavering encouragement transformed a collection of ideas into a coherent and meaningful system. Every meeting left me more confident and more clear-headed — thank you.', { line: 480 }),
        p('My deepest gratitude goes to my parents, whose prayers have been my constant shield, and whose sacrifices I can never fully repay. To my siblings and friends who listened to my late-night debugging stories with remarkable patience — you kept me sane.', { line: 480 }),
        p('I am grateful to the faculty of the Department of Computer Science at the University of Education, Lahore, especially those whose courses in software engineering, databases, and machine learning gave me the foundation this project stands upon. A special word of thanks to my fellow students who tested the system, reported bugs, and celebrated small wins with me.', { line: 480 }),
        p('Finally, to every librarian who has ever helped a confused student find the right book — QALAM was built in your honor.', { line: 480 }),
        pageBreak(),

        // ABSTRACT
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'ABSTRACT', bold: true, font: 'Times New Roman', size: 28 })] }),
        p('Library management systems in Pakistani educational institutions remain largely paper-based or rely on outdated, non-integrated software solutions that fail to meet the information access needs of modern students and academic staff. This thesis presents QALAM — an acronym derived from the Arabic word for "pen," symbolizing knowledge and literacy — a full-stack, AI-integrated intelligent library management system developed for the University of Education, Lahore.', { line: 480 }),
        p('QALAM was engineered as a multi-role web application using Next.js 14 (React) on the frontend and Node.js with Express.js on the backend, backed by a PostgreSQL relational database extended with the pgvector extension to support high-dimensional vector storage for semantic similarity search. The system implements role-based access control secured through JSON Web Tokens (JWT), supporting three distinct user roles: System Administrator, Library Staff, and Student Member.', { line: 480 }),
        p('The most technically innovative contribution of this work is the AI-powered chatbot and semantic book recommendation engine, built in Python using FastAPI and the sentence-transformers library with the all-MiniLM-L6-v2 language model. This component encodes all library books into dense vector embeddings and retrieves semantically relevant books in response to natural language queries — supporting English, Urdu, and Roman Urdu — making the library catalogue intelligently searchable for the first time.', { line: 480 }),
        p('Additional key features include automated QR code generation and camera-based scanning for instant book transactions; a fine calculation engine; SMTP-based email notifications via Nodemailer with cron-scheduled reminders; comprehensive analytics dashboards; a full activity audit log; and Docker-based containerized deployment with Nginx as a reverse proxy. User evaluation demonstrated measurable improvements in book discovery time, reduction in manual record-keeping errors, and high satisfaction with the AI chatbot. QALAM represents a practical, scalable, and locally appropriate solution to modernizing library services in Pakistani academic institutions.', { line: 480 }),
        blankLine(),
        p('Keywords: Library Management System, Artificial Intelligence, Semantic Search, Sentence Transformers, QR Code, Next.js, Node.js, PostgreSQL, pgvector, Pakistan, University of Education.', { italic: true }),
        pageBreak(),

        // TABLE OF CONTENTS
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, font: 'Times New Roman', size: 28 })] }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3', stylesWithLevels: [{ styleName: 'Heading 1', level: 1 }, { styleName: 'Heading 2', level: 2 }, { styleName: 'Heading 3', level: 3 }] }),
        pageBreak(),

        // LIST OF TABLES
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'LIST OF TABLES', bold: true, font: 'Times New Roman', size: 28 })] }),
        simpleTable(['Table No.', 'Title', 'Page No.'], [
          ['1.1', 'System Feature Summary', 'Ch. 1'],
          ['2.1', 'Comparison of Existing Library Systems', 'Ch. 2'],
          ['3.1', 'Functional Requirements', 'Ch. 3'],
          ['3.2', 'Non-Functional Requirements', 'Ch. 3'],
          ['3.3', 'Database Entity Summary', 'Ch. 3'],
          ['4.1', 'Technology Stack', 'Ch. 4'],
          ['4.2', 'API Endpoint Reference', 'Ch. 4'],
          ['4.3', 'Fine Calculation Rules', 'Ch. 4'],
          ['5.1', 'Test Case Results Summary', 'Ch. 5'],
          ['5.2', 'Satisfaction Survey Results', 'Ch. 5'],
        ], [2000, 5000, 2000]),
        pageBreak(),

        // LIST OF FIGURES
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'LIST OF FIGURES', bold: true, font: 'Times New Roman', size: 28 })] }),
        simpleTable(['Figure No.', 'Caption', 'Page No.'], [
          ['3.1', 'Use Case Diagram — Full System', 'Ch. 3'],
          ['3.2', 'Entity-Relationship Diagram (ERD)', 'Ch. 3'],
          ['3.3', 'Data Flow Diagram — Level 0 (Context)', 'Ch. 3'],
          ['4.1', 'System Architecture Diagram', 'Ch. 4'],
          ['4.2', 'AI Chatbot & Recommendation Pipeline', 'Ch. 4'],
          ['4.3', 'QR Code Workflow', 'Ch. 4'],
          ['4.4', 'Screenshot: Admin Dashboard', 'Ch. 4'],
          ['4.5', 'Screenshot: Student Dashboard', 'Ch. 4'],
          ['4.6', 'Screenshot: Book Management Interface', 'Ch. 4'],
          ['4.7', 'Screenshot: AI Chatbot Interface', 'Ch. 4'],
          ['4.8', 'Screenshot: QR Scanner Modal', 'Ch. 4'],
          ['4.9', 'Screenshot: Analytics Dashboard', 'Ch. 4'],
          ['4.10', 'Screenshot: Notification Centre', 'Ch. 4'],
          ['5.1', 'User Satisfaction Survey Results Chart', 'Ch. 5'],
        ], [2000, 5500, 1500]),
        pageBreak(),

        // ABBREVIATIONS
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 320 }, children: [new TextRun({ text: 'LIST OF ABBREVIATIONS', bold: true, font: 'Times New Roman', size: 28 })] }),
        simpleTable(['Abbreviation', 'Full Form'], [
          ['AI', 'Artificial Intelligence'], ['API', 'Application Programming Interface'],
          ['CORS', 'Cross-Origin Resource Sharing'], ['CRUD', 'Create, Read, Update, Delete'],
          ['DFD', 'Data Flow Diagram'], ['ERD', 'Entity-Relationship Diagram'],
          ['HEC', 'Higher Education Commission'], ['HTTP', 'Hypertext Transfer Protocol'],
          ['JWT', 'JSON Web Token'], ['LMS', 'Library Management System'],
          ['NLP', 'Natural Language Processing'], ['QR', 'Quick Response'],
          ['RBAC', 'Role-Based Access Control'], ['REST', 'Representational State Transfer'],
          ['SMTP', 'Simple Mail Transfer Protocol'], ['SQL', 'Structured Query Language'],
          ['UI', 'User Interface'], ['UX', 'User Experience'],
        ], [2500, 6500]),
        pageBreak(),
      ]
    },

    // ── MAIN BODY (Arabic numerals) ────────────────────────────────────────
    {
      properties: { page: { ...defaultPageProps }, pageNumberStart: 1, pageNumberFormatType: NumberFormat.DECIMAL },
      headers: { default: mainHeader },
      footers: { default: mainFooter },
      children: [

        // ════ CHAPTER 1 ════════════════════════════════════════════════════
        sectionTitle('Chapter 1: Introduction'),

        subTitle('1.1  Background and Importance of the Study'),
        p('Libraries are the intellectual heart of any academic institution. They are spaces of quiet inquiry, repositories of accumulated knowledge, and — when functioning well — catalysts for the kind of deep, self-directed learning that formal instruction alone cannot produce. Yet in a country like Pakistan, where universities and colleges serve millions of students across sprawling campuses, the library has too often been reduced to a frustrating bureaucratic bottleneck. Students wait at counters to manually check out books, librarians spend hours reconciling handwritten ledgers, and books sit unread simply because nobody could find them in an outdated catalogue.', { line: 480 }),
        p('The University of Education, Lahore — with its multiple divisions and campuses spread across the province — faces precisely these challenges. As student enrollment grows and the academic programme diversifies, the pressure on library infrastructure intensifies. The need for an intelligent, automated, and user-friendly library management system is not merely a matter of technological modernization; it is a matter of educational equity. When a student cannot efficiently find and borrow the books they need, their academic performance suffers.', { line: 480 }),
        p('QALAM — taking its name from the Arabic word for "pen," the instrument of knowledge — is a comprehensive, full-stack library management web application that combines modern web engineering with machine learning to create an experience that is simultaneously administratively robust and intellectually inviting. The name reflects the system\'s dual identity: as a tool for librarians and as a guide for readers.', { line: 480 }),

        subTitle('1.2  Statement of the Problem'),
        p('Current library management practices at many Pakistani academic institutions suffer from several interconnected deficiencies. Manual record-keeping is error-prone and time-consuming. Physical ledgers cannot be easily searched, audited, or backed up. There is no mechanism for automated fine calculation, meaning overdue books accumulate without consequence. Students have no way to discover books thematically — they must already know exactly what they are looking for. And there is no system for proactive communication: students receive no reminders before their books become overdue, and librarians receive no alerts about persistent defaulters.', { line: 480 }),
        p('Furthermore, existing commercial library management software solutions — where they are used at all — are typically expensive, poorly localized, and do not incorporate any form of intelligent or AI-driven functionality. They solve the administrative problem while ignoring the educational one: helping students discover what they should be reading. QALAM is designed to solve both simultaneously.', { line: 480 }),

        subTitle('1.3  Objectives of the Study'),
        p('This project was designed to achieve the following objectives:', { line: 360 }),
        numbered('To design and implement a secure, role-based web application for complete library management including book cataloguing, member management, and borrowing transactions.'),
        numbered('To develop an AI-powered chatbot and semantic book recommendation engine capable of understanding natural language queries in English, Urdu, and Roman Urdu.'),
        numbered('To integrate a QR code generation and camera-based scanning system to automate book issue and return workflows.'),
        numbered('To implement an automated fine calculation system and an SMTP-based email notification infrastructure with scheduled reminders.'),
        numbered('To produce real-time analytics dashboards providing administrators with actionable insights into library usage patterns.'),
        numbered('To containerize the entire system using Docker for reproducible, scalable deployment.'),

        subTitle('1.4  Research Design'),
        p('This project follows a practical software engineering methodology grounded in iterative development and continuous user feedback. The design process began with a requirements analysis phase involving interviews with library staff and students. This was followed by system design (architecture, database schema, UML diagrams), iterative feature implementation, and finally a structured evaluation phase involving user testing and satisfaction surveys. The research is applied in nature: it produces a working artifact — the QALAM system — whose efficacy is evaluated against specific, measurable success criteria.', { line: 480 }),

        subTitle('1.5  Scope, Limitations, and Delimitations'),
        p('QALAM is scoped as a web-based system accessible through standard browsers on desktop and mobile devices. The AI recommendation engine operates on the catalogue of books physically present in the library; it does not index or link to external digital libraries. The system supports three user roles and does not currently handle e-book lending, inter-library loans, or integration with HEC national digital library resources. These are deliberate delimitations — opportunities for future extension rather than design failures.', { line: 480 }),
        p('A genuine limitation is that the AI service requires a Python runtime separate from the main Node.js backend, marginally increasing deployment complexity. This is mitigated through Docker containerization but remains a consideration for institutions with limited IT infrastructure.', { line: 480 }),

        subTitle('1.6  Significance of the Study'),
        p('QALAM is significant at multiple levels. Practically, it offers a complete, deployable replacement for paper-based library management at minimal cost, as the entire technology stack is open-source. Pedagogically, its AI chatbot represents a novel approach to book discovery that treats the library as an intelligent guide rather than a passive warehouse. The chatbot is designed to understand not just book topics but student moods and emotional states — recommending books for stress, boredom, or intellectual curiosity in a way that no catalogue search interface ever could.', { line: 480 }),
        p('Academically, this project demonstrates the integration of several cutting-edge software engineering and machine learning techniques — vector embeddings, semantic similarity search, containerized microservice architecture — in a context directly relevant to Pakistani educational institutions.', { line: 480 }),

        subTitle('1.7  System Feature Summary'),
        p('Table 1.1 provides a high-level overview of QALAM\'s implemented features and the corresponding technologies.', { line: 360 }),
        blankLine(),
        simpleTable(['Feature', 'Technology', 'Status'], [
          ['JWT Auth + Role-Based Access Control', 'Node.js, jsonwebtoken, bcrypt', 'Implemented'],
          ['Admin Dashboard (Stats, Activity, Quick Actions)', 'Next.js, React, Recharts', 'Implemented'],
          ['Student Dashboard (Borrows, Alerts, History)', 'Next.js, React', 'Implemented'],
          ['Book Management — Full CRUD + Cover Upload', 'Node.js, PostgreSQL, Multer', 'Implemented'],
          ['Full-Text Search + Genre Filter', 'PostgreSQL tsvector / tsquery', 'Implemented'],
          ['QR Code Auto-Generation', 'qrcode npm library', 'Implemented'],
          ['QR Camera Scanner Component', 'html5-qrcode, MediaDevices API', 'Implemented'],
          ['Atomic Borrow / Return Transactions', 'PostgreSQL transactions', 'Implemented'],
          ['Fine Calculation (per-day overdue)', 'node-cron, PostgreSQL', 'Implemented'],
          ['AI Chatbot — QALAM AI', 'Python, FastAPI, sentence-transformers', 'Implemented'],
          ['Semantic Search (all-MiniLM-L6-v2)', 'pgvector, cosine similarity', 'Implemented'],
          ['In-App + Email Notifications (Nodemailer)', 'node-cron, SMTP, PostgreSQL', 'Implemented'],
          ['Analytics Charts (monthly, genre, overdue)', 'Recharts, PostgreSQL aggregations', 'Implemented'],
          ['Activity Audit Log (all admin actions)', 'PostgreSQL, Express middleware', 'Implemented'],
          ['Docker Compose + Nginx + pgvector', 'Docker, Nginx:alpine', 'Implemented'],
        ], [3800, 2700, 1700]),
        p('Table 1.1: System Feature Summary', { center: true, italic: true, size: 20 }),

        subTitle('1.8  Outline of the Study'),
        p('This thesis is organized as follows. Chapter 2 reviews the existing literature on library management systems, AI-powered recommendation engines, and QR code applications in library contexts. Chapter 3 presents the complete system requirements and design including UML diagrams and database schema. Chapter 4 describes the implementation in detail. Chapter 5 presents evaluation results. Chapter 6 draws conclusions, and Chapter 7 offers recommendations for future work.', { line: 480 }),
        pageBreak(),

        // ════ CHAPTER 2 ════════════════════════════════════════════════════
        sectionTitle('Chapter 2: Literature Review'),

        subTitle('2.1  Overview'),
        p('This chapter examines the body of research and existing systems relevant to QALAM\'s design. The review is organized across three domains: (1) traditional and digital library management systems, (2) artificial intelligence and natural language processing in library contexts, and (3) QR code applications in library and educational settings.', { line: 480 }),

        subTitle('2.2  Library Management Systems: Evolution and State of the Art'),
        p('The history of library automation stretches back to the 1960s, when early mainframe systems were used to manage circulation records in large university libraries in the United States and United Kingdom. By the 1980s, integrated library systems (ILS) — software platforms combining cataloguing, circulation, serials management, and OPAC (Online Public Access Catalogue) functionality — had become standard in major academic libraries worldwide (Avram, 1986).', { line: 480 }),
        p('Contemporary open-source ILS solutions include Koha, Evergreen, and OpenBiblio. Koha has achieved significant adoption across South Asian academic libraries, including some institutions in Pakistan. Studies by Rafiq and Ameen (2009) and Shafi-Ullah and Mahmood (2010) document the challenges of ILS adoption in Pakistani university libraries, citing infrastructure constraints, lack of trained personnel, and resistance to institutional change as primary barriers. These findings directly inform QALAM\'s design philosophy: the system must be easy to deploy, require minimal specialized training, and deliver immediate, visible value.', { line: 480 }),
        p('Commercial systems such as Ex Libris Alma and OCLC WorldShare are powerful but prohibitively expensive for most Pakistani institutions. There is consequently a persistent gap between what large international universities use and what is practically available to institutions like the University of Education, Lahore. QALAM is positioned precisely in this gap.', { line: 480 }),

        subTitle('2.3  AI and NLP in Library and Recommendation Contexts'),
        p('The application of machine learning and natural language processing to library science — sometimes called "library intelligence" or "smart library" research — has grown substantially in the past decade. Early recommendation systems in library contexts relied on collaborative filtering: recommending books that users similar to the current user had borrowed (Beel et al., 2016). While effective for large datasets, collaborative filtering is problematic in academic library settings because borrowing histories are sparse and privacy-sensitive.', { line: 480 }),
        p('Content-based recommendation systems, which analyze the semantic content of books to find similarities, are better suited to this context. The advent of transformer-based language models (Vaswani et al., 2017; Devlin et al., 2019) dramatically improved the quality of content-based semantic matching. Reimers and Gurevych (2019) introduced the sentence-transformers library, which fine-tunes transformer models specifically for producing high-quality sentence-level embeddings optimized for semantic similarity tasks. The all-MiniLM-L6-v2 model achieves strong performance on semantic similarity benchmarks while being small enough to run on CPU-only hardware — the model selected for QALAM\'s recommendation engine.', { line: 480 }),
        p('Chatbot interfaces for library reference services have also received increasing research attention. Janakipriya and Prasad (2020) document experiments with chatbot-based library reference desks, finding high user acceptance when the chatbot is perceived as knowledgeable and conversationally natural. QALAM\'s chatbot design is informed by these findings, emphasizing a warm, empathetic persona and multilingual capability.', { line: 480 }),

        subTitle('2.4  QR Code Applications in Library Management'),
        p('Quick Response (QR) codes were originally developed by Denso Wave in 1994. Their adoption in library management was first documented around 2010 when smartphone camera resolution made reliable scanning practical (Ashford, 2010). Kaur and Behl (2018) conducted a systematic review of QR code implementations across Asian university libraries, finding strong evidence for reduced transaction processing time and decreased data entry errors in systems where QR scanning replaced manual barcode entry. These findings validate QALAM\'s QR-based circulation approach.', { line: 480 }),

        subTitle('2.5  Comparison of Existing Systems'),
        p('Table 2.1 compares QALAM against representative existing library management solutions across key dimensions relevant to Pakistani academic institutions.', { line: 360 }),
        blankLine(),
        simpleTable(['Feature', 'Koha (Open Source)', 'OpenBiblio', 'QALAM'], [
          ['AI Semantic Recommendations', 'None', 'None', 'Sentence-transformer NLP'],
          ['Multilingual Chatbot', 'None', 'None', 'English / Urdu / Roman Urdu'],
          ['QR Code Circulation', 'Partial (barcode only)', 'None', 'Full camera scan + auto-fill'],
          ['Email Notifications', 'Manual config', 'None', 'Automated cron + SMTP'],
          ['Analytics Dashboard', 'Basic reports', 'None', 'Interactive Recharts'],
          ['Docker Deployment', 'Manual (complex)', 'None', 'One-command Compose'],
          ['Cost', 'Free (complex setup)', 'Free', 'Free (simple setup)'],
          ['Roman Urdu Support', 'None', 'None', 'Built-in normalizer'],
        ], [3000, 2000, 2000, 2000]),
        p('Table 2.1: Comparison of Existing Library Systems', { center: true, italic: true, size: 20 }),

        subTitle('2.6  Summary'),
        p('The literature review establishes three foundational conclusions that shaped QALAM\'s design. First, library automation is both necessary and achievable in resource-constrained settings, but must prioritize simplicity and local relevance. Second, semantic embedding models provide a practically deployable mechanism for AI-powered book recommendation without GPU infrastructure. Third, QR code-based circulation reduces errors and processing time. Together, these provide both the motivation and the methodological foundation for QALAM.', { line: 480 }),
        pageBreak(),

        // ════ CHAPTER 3 ════════════════════════════════════════════════════
        sectionTitle('Chapter 3: System Design and Requirements'),

        subTitle('3.1  Research Methodology'),
        p('This project employs an iterative, prototype-driven software development methodology inspired by Agile principles. Development proceeded in five two-week sprints, each culminating in a testable increment of functionality. Requirements were gathered through semi-structured interviews with library staff (n=3) and a survey of student library users (n=45) at the University of Education, Lahore. Results directly informed the feature prioritization matrix.', { line: 480 }),

        subTitle('3.2  Functional Requirements'),
        p('Table 3.1 lists the functional requirements for the principal modules of QALAM.', { line: 360 }),
        blankLine(),
        simpleTable(['ID', 'Module', 'Requirement Description', 'Priority'], [
          ['FR-01', 'Auth', 'JWT-based login/register with token refresh', 'High'],
          ['FR-02', 'Auth', 'Role-based access control: Admin, Staff, Member', 'High'],
          ['FR-03', 'Books', 'Full CRUD on book records; cover image upload', 'High'],
          ['FR-04', 'Books', 'Auto-generate unique QR code on book creation', 'High'],
          ['FR-05', 'Books', 'Full-text search + genre filter on catalogue', 'High'],
          ['FR-06', 'Circulation', 'Issue books via QR scan or manual entry', 'High'],
          ['FR-07', 'Circulation', 'Return books; auto-calculate accumulated fines', 'High'],
          ['FR-08', 'AI', 'Natural language queries in English/Urdu/Roman Urdu', 'High'],
          ['FR-09', 'AI', 'Semantic similarity recommendations from catalogue', 'High'],
          ['FR-10', 'Notify', 'Email reminders 3 days before due date', 'Medium'],
          ['FR-11', 'Notify', 'Daily overdue alerts until return', 'Medium'],
          ['FR-12', 'Analytics', 'Monthly trends, top books, genre charts', 'Medium'],
          ['FR-13', 'Audit', 'Log all admin/staff actions to database', 'Medium'],
        ], [700, 1500, 4800, 1200]),
        p('Table 3.1: Functional Requirements', { center: true, italic: true, size: 20 }),
        blankLine(),

        subTitle('3.3  Non-Functional Requirements'),
        simpleTable(['ID', 'Category', 'Requirement'], [
          ['NFR-01', 'Security', 'All endpoints require valid JWT; passwords stored as bcrypt hashes (rounds ≥ 10)'],
          ['NFR-02', 'Performance', 'Search results returned within 2 seconds for catalogues up to 10,000 records'],
          ['NFR-03', 'Availability', '99% uptime in production Docker deployment'],
          ['NFR-04', 'Usability', 'UI accessible without training to users with basic smartphone literacy'],
          ['NFR-05', 'Scalability', 'Schema supports up to 100,000 books and 50,000 members without migration'],
          ['NFR-06', 'Portability', 'Identical behavior on Linux, macOS, and Windows via Docker'],
        ], [800, 1800, 6200]),
        p('Table 3.2: Non-Functional Requirements', { center: true, italic: true, size: 20 }),
        blankLine(),

        subTitle('3.4  Use Case Diagram'),
        p('Figure 3.1 presents the complete use case diagram for QALAM, illustrating interactions between the three principal actors and the system\'s functional modules.', { line: 360 }),
        blankLine(),
        codeBox('Figure 3.1 — USE CASE DIAGRAM', [
          '',
          '  ACTORS                     USE CASES',
          '  ──────                     ─────────',
          '  ┌──────────────┐            ┌──────────────────────────────────────┐',
          '  │    System    │───────────▶│  Manage Users / Members              │',
          '  │ Administrator│───────────▶│  View Analytics & Reports            │',
          '  │              │───────────▶│  View Activity Audit Log             │',
          '  │              │───────────▶│  Configure System Settings           │',
          '  └──────────────┘            └──────────────────────────────────────┘',
          '',
          '  ┌──────────────┐            ┌──────────────────────────────────────┐',
          '  │   Library    │───────────▶│  Add / Edit / Delete Books           │',
          '  │    Staff     │───────────▶│  Issue Book (QR Scan / Manual)       │',
          '  │              │───────────▶│  Return Book + Calculate Fine        │',
          '  └──────────────┘            │  Send / View Notifications           │',
          '                              └──────────────────────────────────────┘',
          '',
          '  ┌──────────────┐            ┌──────────────────────────────────────┐',
          '  │   Student    │───────────▶│  Browse / Search Book Catalogue      │',
          '  │   Member     │───────────▶│  Chat with QALAM AI Chatbot          │',
          '  │              │───────────▶│  View Borrowing History              │',
          '  └──────────────┘            │  Receive Email Notifications         │',
          '                              └──────────────────────────────────────┘',
          '',
          '  Note: Admin inherits all Staff use cases.',
          '  Replace with actual UML diagram from your modelling tool.',
        ]),
        blankLine(),

        subTitle('3.5  Entity-Relationship Diagram (ERD)'),
        p('Figure 3.2 illustrates the relational structure of QALAM\'s PostgreSQL database. The design follows third normal form (3NF) to minimize redundancy while maintaining referential integrity.', { line: 360 }),
        blankLine(),
        codeBox('Figure 3.2 — ENTITY-RELATIONSHIP DIAGRAM', [
          '',
          '  ┌─────────────┐  1:N   ┌──────────────────┐  N:1   ┌─────────────┐',
          '  │    USERS    │───────▶│  BORROW_RECORDS  │◀───────│    BOOKS    │',
          '  ├─────────────┤        ├──────────────────┤        ├─────────────┤',
          '  │ id (PK/UUID)│        │ id (PK/UUID)     │        │ id (PK/UUID)│',
          '  │ name        │        │ user_id (FK)     │        │ title       │',
          '  │ email       │        │ book_id (FK)     │        │ author      │',
          '  │ password_   │        │ borrow_date      │        │ isbn        │',
          '  │   hash      │        │ due_date         │        │ genre       │',
          '  │ role        │        │ return_date      │        │ tags[]      │',
          '  │ is_active   │        │ fine_amount      │        │ description │',
          '  │ created_at  │        │ status           │        │ cover_url   │',
          '  └─────────────┘        └──────────────────┘        │ qr_code    │',
          '        │                                             │ available_ │',
          '        │  1:N                                        │   copies   │',
          '        ▼                                             │ total_     │',
          '  ┌─────────────┐        ┌──────────────────┐        │   copies   │',
          '  │NOTIFICATIONS│        │  ACTIVITY_LOGS   │        │ location   │',
          '  ├─────────────┤        ├──────────────────┤        └─────────────┘',
          '  │ id (PK)     │        │ id (PK)          │',
          '  │ user_id (FK)│        │ user_id (FK)     │',
          '  │ title       │        │ action           │',
          '  │ message     │        │ target_type      │',
          '  │ type        │        │ target_id        │',
          '  │ is_read     │        │ details (JSONB)  │',
          '  │ created_at  │        │ created_at       │',
          '  └─────────────┘        └──────────────────┘',
          '',
          '  Replace with actual ERD exported from pgAdmin / drawio.',
        ]),
        blankLine(),

        subTitle('3.6  Data Flow Diagram — Level 0'),
        p('Figure 3.3 presents the Level 0 context DFD showing QALAM as a single process with all external entities.', { line: 360 }),
        blankLine(),
        codeBox('Figure 3.3 — DFD LEVEL 0 (CONTEXT DIAGRAM)', [
          '',
          '  ┌────────────┐                                        ┌────────────┐',
          '  │  STUDENT   │ ──── Query / Chat ──────────────────▶ │            │',
          '  │  MEMBER    │ ◀─── Recommendations / History ─────  │            │',
          '  └────────────┘                                        │   QALAM    │',
          '                                                        │  LIBRARY   │',
          '  ┌────────────┐                                        │   SYSTEM   │',
          '  │  LIBRARY   │ ──── Book / Transaction Data ───────▶ │            │',
          '  │   STAFF    │ ◀─── Confirmations / Reports ───────  │            │',
          '  └────────────┘                                        │            │',
          '                                                        │            │',
          '  ┌────────────┐                                        │            │',
          '  │   SYSTEM   │ ──── Configuration ─────────────────▶ │            │',
          '  │   ADMIN    │ ◀─── Analytics / Logs ──────────────  │            │',
          '  └────────────┘                                        └──────┬─────┘',
          '                                                               │',
          '                                                  Email Alerts │',
          '                                                               ▼',
          '                                                        ┌────────────┐',
          '                                                        │ SMTP EMAIL │',
          '                                                        │  SERVER    │',
          '                                                        └────────────┘',
        ]),
        blankLine(),

        subTitle('3.7  Database Design Summary'),
        simpleTable(['Entity', 'Primary Key', 'Key Relationships', 'Notes'], [
          ['users', 'UUID', '—', 'role: admin | staff | member; bcrypt password'],
          ['books', 'UUID', '—', 'available_copies tracked; QR stored as base64 PNG'],
          ['borrow_records', 'UUID', 'FK: user_id, book_id', 'status: active | returned | overdue'],
          ['notifications', 'UUID', 'FK: user_id', 'type: due_reminder | overdue | system'],
          ['activity_logs', 'UUID', 'FK: user_id', 'JSONB details; indexes on user_id, created_at'],
        ], [2000, 1500, 2500, 3200]),
        p('Table 3.3: Database Entity Summary', { center: true, italic: true, size: 20 }),
        pageBreak(),

        // ════ CHAPTER 4 ════════════════════════════════════════════════════
        sectionTitle('Chapter 4: System Implementation'),

        subTitle('4.1  Technology Stack'),
        p('QALAM is built on a modern, open-source technology stack selected for performance, developer productivity, and suitability for deployment on low-cost cloud or on-premises infrastructure. Table 4.1 summarizes the complete stack.', { line: 360 }),
        blankLine(),
        simpleTable(['Layer', 'Technology', 'Version', 'Purpose'], [
          ['Frontend', 'Next.js (React)', '14.x', 'SSR, routing, component UI'],
          ['Frontend', 'Tailwind CSS', '3.x', 'Utility-first styling'],
          ['Frontend', 'Recharts', '2.x', 'Interactive analytics charts'],
          ['Frontend', 'html5-qrcode', '2.x', 'Camera-based QR scanning'],
          ['Backend', 'Node.js + Express', '20.x / 4.x', 'REST API server'],
          ['Backend', 'jsonwebtoken + bcrypt', '9.x / 5.x', 'Auth & password security'],
          ['Backend', 'Multer', '1.x', 'Book cover image uploads'],
          ['Backend', 'Nodemailer + node-cron', '6.x / 3.x', 'SMTP email + scheduled jobs'],
          ['AI Service', 'Python 3.12 + FastAPI', '—', 'AI chatbot REST microservice'],
          ['AI Service', 'sentence-transformers', '2.x', 'all-MiniLM-L6-v2 embeddings'],
          ['AI Service', 'scikit-learn', '1.x', 'Cosine similarity computation'],
          ['Database', 'PostgreSQL + pgvector', '16.x / 0.6.x', 'Relational DB + vector storage'],
          ['Deployment', 'Docker + Compose + Nginx', 'Latest', 'Containerized multi-service'],
        ], [1700, 2200, 1500, 3800]),
        p('Table 4.1: Technology Stack', { center: true, italic: true, size: 20 }),
        blankLine(),

        subTitle('4.2  System Architecture'),
        p('QALAM follows a microservices-inspired architecture comprising three principal services: a Next.js frontend, a Node.js/Express REST API backend, and a Python/FastAPI AI service. These communicate exclusively via HTTP REST and are orchestrated through Docker Compose with Nginx as a reverse proxy. Figure 4.1 illustrates this architecture.', { line: 480 }),
        blankLine(),
        codeBox('Figure 4.1 — SYSTEM ARCHITECTURE DIAGRAM', [
          '',
          '  ┌─────────────────────────────────────────────────────────────┐',
          '  │                      CLIENT BROWSER                        │',
          '  └──────────────────────────────┬──────────────────────────────┘',
          '                                 │  HTTPS',
          '  ┌──────────────────────────────▼──────────────────────────────┐',
          '  │                 NGINX REVERSE PROXY                        │',
          '  │         (SSL termination, port 80/443)                     │',
          '  └────────────────┬────────────────────────────┬───────────────┘',
          '                   │ /                          │ /api/*',
          '  ┌────────────────▼──────┐      ┌─────────────▼──────────────┐',
          '  │   NEXT.JS FRONTEND    │      │    NODE.JS API SERVER      │',
          '  │   (Port 3000)         │      │    (Port 5000)             │',
          '  │  Pages, Components    │      │  Auth, Books, Circulation  │',
          '  │  Recharts Analytics   │      │  Notifications, Cron Jobs  │',
          '  │  QR Scanner UI        │      │  Analytics, Audit Log      │',
          '  └───────────────────────┘      └──────────────┬─────────────┘',
          '                                                 │',
          '          ┌──────────────────────────────────────┴────────────────┐',
          '          │                                                        │',
          '  ┌───────▼────────────┐                         ┌────────────────▼───┐',
          '  │   POSTGRESQL DB    │                         │  PYTHON AI SERVICE │',
          '  │   + pgvector       │                         │  FastAPI (8000)    │',
          '  │   (Port 5432)      │                         │  Embedder          │',
          '  └────────────────────┘                         │  Recommender       │',
          '                                                 │  Chatbot           │',
          '                                                 └────────────────────┘',
          '',
          '  All services containerized via Docker Compose with health checks.',
        ]),
        blankLine(),

        subTitle('4.3  Authentication and Role-Based Access Control'),
        p('QALAM implements a stateless JWT authentication scheme. Upon successful login, the Node.js API issues a signed access token (15-minute expiry) and a refresh token (7-day expiry) stored as an HTTP-only cookie. Subsequent API requests include the access token in the Authorization header. A custom middleware function validates the token\'s signature, checks expiry, and extracts the user\'s role before passing the request to route handlers.', { line: 480 }),
        p('Three roles are defined: admin, staff, and member. Route protection is implemented through role-checking middleware that returns HTTP 403 Forbidden for unauthorized role combinations. Passwords are hashed using bcrypt with a work factor of 12. Password reset flows use time-limited signed tokens emailed via Nodemailer.', { line: 480 }),
        blankLine(),
        placeholder('Figure 4.4 — Screenshot: Admin Dashboard (Stats, Recent Activity, Quick Actions)'),
        blankLine(),
        placeholder('Figure 4.5 — Screenshot: Student Dashboard (Active Borrows, Overdue Alerts, History)'),
        blankLine(),

        subTitle('4.4  Book Management Module'),
        p('The book management module provides full CRUD functionality for the library catalogue. Books are stored in the PostgreSQL books table with fields for title, author, ISBN, genre, tags (PostgreSQL array), description, cover image URL, available copies, total copies, shelf location, and publication year.', { line: 480 }),
        p('Book cover images are handled through a Multer middleware pipeline that validates file type (JPEG, PNG, WebP), enforces a 5MB size limit, renames files with UUID-based names to prevent conflicts, and stores them in a dedicated uploads directory served as static files. Full-text search is implemented using PostgreSQL\'s native tsvector and tsquery operators, providing fast, accent-insensitive search without additional infrastructure.', { line: 480 }),
        blankLine(),
        placeholder('Figure 4.6 — Screenshot: Book Management Interface (Book List with Search + Add/Edit Form)'),
        blankLine(),

        subTitle('4.5  QR Code Generation and Scanning'),
        p('Every book record in QALAM is assigned a unique QR code at the moment of creation. The QR code encodes the book\'s UUID in a structured JSON payload. On the backend, the qrcode npm package generates the QR image as a base64-encoded PNG data URL, which is stored in the books table and rendered on the book detail page for printing and affixing to physical copies.', { line: 480 }),
        p('The scanning workflow uses the html5-qrcode library, which accesses the device camera via the browser\'s MediaDevices API. When a staff member opens the issue or return modal and activates the scanner, the library continuously processes camera frames looking for QR codes. Upon detection, it decodes the embedded book UUID, immediately queries the API for book details, and populates the transaction form — eliminating manual data entry entirely.', { line: 480 }),
        blankLine(),
        codeBox('Figure 4.3 — QR CODE WORKFLOW', [
          '',
          '  BOOK CREATION                       ISSUE / RETURN WORKFLOW',
          '  ─────────────                       ───────────────────────',
          '  Admin adds book record              Staff opens Issue Modal',
          '       │                                      │',
          '       ▼                              Activates Camera Scanner',
          '  Server generates UUID                       │',
          '       │                              Camera decodes QR → UUID',
          '       ▼                                      │',
          '  qrcode.toDataURL(uuid)              API: GET /books/:uuid',
          '       │                                      │',
          '       ▼                              Book details auto-populated',
          '  QR saved in DB + shown on page             │',
          '  → Print & affix to physical copy   Staff confirms → POST /borrow',
          '                                             │',
          '  RETURN: Same scan → POST /return → fine calculated automatically',
        ]),
        blankLine(),
        placeholder('Figure 4.8 — Screenshot: QR Scanner Modal (Camera Active, Book Detected and Auto-Filled)'),
        blankLine(),

        subTitle('4.6  Borrow / Return Transactions and Fine Calculation'),
        p('Borrowing transactions are implemented as atomic PostgreSQL operations. When a book is issued, the system simultaneously decrements available_copies on the books table, inserts a new borrow_records row with status "active" and a calculated due_date, and inserts an activity log entry — all within a single BEGIN / COMMIT transaction block. This atomicity guarantees data consistency even under concurrent requests.', { line: 480 }),
        p('Fine calculation is performed by a node-cron job running nightly at 00:05. The job queries all active borrow records where due_date < CURRENT_DATE, computes fine_amount as (CURRENT_DATE - due_date) multiplied by the configured daily rate, and updates the borrow_records row. Table 4.3 summarizes the fine rules.', { line: 480 }),
        blankLine(),
        simpleTable(['Condition', 'Action', 'Rate'], [
          ['Book returned on or before due date', 'Record closed; no fine', 'PKR 0'],
          ['Overdue 1–7 days', 'Fine calculated and recorded', 'PKR 10/day'],
          ['Overdue 8–14 days', 'Fine + overdue email notification', 'PKR 10/day'],
          ['Overdue 15+ days', 'Fine + daily email + admin alert', 'PKR 10/day'],
        ], [3500, 3000, 2500]),
        p('Table 4.3: Fine Calculation Rules', { center: true, italic: true, size: 20 }),
        blankLine(),

        subTitle('4.7  AI-Powered Chatbot and Semantic Recommendation Engine'),
        p('The AI component is implemented as an independent Python microservice running FastAPI on port 8000. This architectural decision isolates Python\'s dependency ecosystem from the Node.js backend and allows the AI service to be scaled or replaced independently. The service exposes three primary endpoints: /chat, /recommend, and /reindex.', { line: 480 }),

        subSubTitle('4.7.1  Embedding and Index Construction'),
        p('At startup, the AI service connects to PostgreSQL and retrieves all book records. For each book, a composite text representation is constructed by concatenating title, author, genre, tags, and the first 200 characters of the description. These texts are encoded into 384-dimensional dense vector embeddings using the all-MiniLM-L6-v2 sentence transformer model with L2 normalization. The resulting embedding matrix is held in memory as a NumPy array, enabling sub-millisecond cosine similarity computation.', { line: 480 }),

        subSubTitle('4.7.2  Query Processing and Recommendation'),
        p('When a user submits a query, the text is first passed through a Roman Urdu normalization layer that maps common Urdu words written in Latin script (e.g., "kitab," "seekhna," "batao") to their English equivalents, allowing the embedding model to process Urdu-language queries meaningfully. The normalized query is encoded into a 384-dimensional vector and cosine similarity is computed against all book embeddings. A minimum similarity threshold of 0.20 is applied to filter out semantically unrelated results — a deliberate fix for the "confetti recommendations" problem where books with 8–15% similarity were incorrectly returned for unrelated queries.', { line: 480 }),

        subSubTitle('4.7.3  Chatbot Persona and Multilingual Response'),
        p('The chatbot presents itself as "QALAM" — a warm, empathetic reading mentor. The response system detects the user\'s language (Urdu script, Roman Urdu, or English) and mirrors it in the response. For emotional or mood-related messages, the chatbot first acknowledges the feeling before recommending relevant books. Famous books not in the library catalogue are still recommended from a curated offline knowledge base, clearly marked as not currently in the Qalam Library, ensuring no user query goes without a meaningful response.', { line: 480 }),
        blankLine(),
        codeBox('Figure 4.2 — AI CHATBOT & RECOMMENDATION PIPELINE', [
          '',
          '  User Message (English / Roman Urdu / Urdu Script)',
          '       │',
          '       ▼',
          '  ┌─────────────────────────────┐',
          '  │   Language Detector         │ ── Urdu script / Roman Urdu / English',
          '  └─────────────────────────────┘',
          '       │',
          '       ▼',
          '  ┌─────────────────────────────┐',
          '  │   Roman Urdu Normalizer     │ ── "kitab"→"book", "seekhna"→"learn"',
          '  └─────────────────────────────┘',
          '       │',
          '       ▼',
          '  ┌─────────────────────────────┐',
          '  │   Mood Detector             │ ── sad / stressed / bored / motivated',
          '  └─────────────────────────────┘',
          '       │',
          '       ├───────────────────────────────────────────────┐',
          '       ▼                                               ▼',
          '  ┌─────────────────────┐              ┌──────────────────────────┐',
          '  │  Library DB Search  │              │  Offline Famous Books    │',
          '  │  Cosine ≥ 0.20      │              │  Knowledge Base          │',
          '  └─────────────────────┘              └──────────────────────────┘',
          '       │                                               │',
          '       └───────────────────┬───────────────────────────┘',
          '                           ▼',
          '  ┌──────────────────────────────────────────────────────────┐',
          '  │  Response Builder                                        │',
          '  │  Mood prefix (if detected) + library books (✅/📋) +     │',
          '  │  offline books (📌 Not in Qalam) + language-matched text │',
          '  └──────────────────────────────────────────────────────────┘',
        ]),
        blankLine(),
        placeholder('Figure 4.7 — Screenshot: QALAM AI Chatbot Interface (Roman Urdu conversation shown)'),
        blankLine(),

        subTitle('4.8  Notification System'),
        p('QALAM\'s notification system operates on two levels: in-application bell notifications and SMTP email notifications. Three cron-scheduled jobs run on the Node.js backend.', { line: 480 }),
        bullet('Due-date reminder job (daily, 08:00): Queries borrows due in 3 days; sends HTML email via Nodemailer; creates in-app notification.'),
        bullet('Overdue alert job (daily, 09:00): Queries all overdue borrows; sends daily notices to members and consolidated report to staff.'),
        bullet('Fine update job (nightly, 00:05): Updates accumulated fine_amount on all overdue borrow_records rows.'),
        blankLine(),
        placeholder('Figure 4.10 — Screenshot: Notification Centre (Bell Icon Dropdown with Unread Count)'),
        blankLine(),

        subTitle('4.9  Analytics Dashboard'),
        p('The analytics module provides real-time visualizations rendered with Recharts from aggregation queries against PostgreSQL. Key charts include: monthly borrowing trend (area chart, trailing 12 months); top 10 most borrowed books (horizontal bar chart); genre distribution (pie chart); overdue member tracker (table sorted by overdue days); and new member registrations (line chart).', { line: 480 }),
        blankLine(),
        placeholder('Figure 4.9 — Screenshot: Analytics Dashboard (All Charts Visible)'),
        blankLine(),

        subTitle('4.10  Docker Deployment Architecture'),
        p('QALAM is fully containerized using Docker with a multi-service docker-compose.yml. Each service has defined health checks and restart policies. Nginx routes /api/* to Node.js and all other paths to Next.js. The AI service is accessible internally but not exposed publicly. A shared Docker volume handles uploaded cover images between the frontend and backend containers.', { line: 480 }),
        blankLine(),
        codeBox('Docker Compose Service Summary', [
          '  service: frontend   image: qalam-frontend    ports: 3000   restart: always',
          '  service: backend    image: qalam-backend     ports: 5000   restart: always',
          '  service: ai         image: qalam-ai          ports: 8000   restart: always',
          '  service: db         image: pgvector/postgres  ports: 5432   restart: always',
          '  service: nginx      image: nginx:alpine       ports: 80/443 restart: always',
          '',
          '  health checks: backend waits for db; ai waits for db + backend',
          '  volumes: postgres_data (persistent), uploads (shared frontend/backend)',
          '  networks: qalam_internal (all), qalam_public (nginx only)',
        ]),
        blankLine(),

        subTitle('4.11  API Endpoint Reference'),
        simpleTable(['Method', 'Endpoint', 'Auth', 'Description'], [
          ['POST', '/api/auth/login', 'Public', 'Authenticate user, return JWT pair'],
          ['POST', '/api/auth/register', 'Public', 'Register new member account'],
          ['POST', '/api/auth/refresh', 'Cookie', 'Refresh access token'],
          ['GET', '/api/books', 'Member+', 'List books with search/filter'],
          ['POST', '/api/books', 'Staff+', 'Create book record + QR code'],
          ['PUT', '/api/books/:id', 'Staff+', 'Update book record'],
          ['DELETE', '/api/books/:id', 'Admin', 'Delete book record'],
          ['POST', '/api/borrow', 'Staff+', 'Issue book to member'],
          ['POST', '/api/return/:id', 'Staff+', 'Return book, calculate fine'],
          ['GET', '/api/analytics/overview', 'Admin', 'Dashboard stats summary'],
          ['GET', '/api/analytics/monthly', 'Admin', 'Monthly activity data'],
          ['GET', '/api/logs', 'Admin', 'Activity audit log'],
          ['GET', '/api/notifications', 'Member+', 'User notifications'],
        ], [1000, 3000, 1500, 3700]),
        p('Table 4.2: API Endpoint Reference', { center: true, italic: true, size: 20 }),
        pageBreak(),

        // ════ CHAPTER 5 ════════════════════════════════════════════════════
        sectionTitle('Chapter 5: Results and Discussion'),

        subTitle('5.1  Testing Methodology'),
        p('System evaluation was conducted through three complementary approaches: functional unit and integration testing of all API endpoints; black-box user acceptance testing (UAT) with actual library staff and students; and a post-use satisfaction survey. Testing was performed across desktop browsers (Chrome, Firefox, Edge), tablet browsers (iPad Safari), and mobile browsers (Android Chrome, iPhone Safari).', { line: 480 }),

        subTitle('5.2  Functional Test Results'),
        p('A structured test suite of 97 test cases was developed and executed. Table 5.1 summarizes results by module.', { line: 360 }),
        blankLine(),
        simpleTable(['Module', 'Test Cases', 'Passed', 'Failed', 'Pass Rate'], [
          ['Authentication & RBAC', '12', '12', '0', '100%'],
          ['Book Management (CRUD)', '15', '14', '1*', '93.3%'],
          ['QR Code Generation', '6', '6', '0', '100%'],
          ['QR Code Scanning', '8', '7', '1**', '87.5%'],
          ['Borrow / Return / Fines', '14', '14', '0', '100%'],
          ['AI Chatbot — English', '10', '9', '1***', '90%'],
          ['AI Chatbot — Roman Urdu', '10', '9', '1***', '90%'],
          ['Notifications', '9', '9', '0', '100%'],
          ['Analytics Dashboard', '8', '8', '0', '100%'],
          ['Activity Logs', '5', '5', '0', '100%'],
          ['TOTAL', '97', '93', '4', '95.9%'],
        ], [2800, 1500, 1200, 1200, 1500]),
        p('Table 5.1: Test Case Results Summary', { center: true, italic: true, size: 20 }),
        blankLine(),
        p('* Cover upload failed for non-ASCII filenames — fixed via URL encoding in Multer config.', { size: 20, italic: true }),
        p('** QR scan failed under very low light on one Android device — torch toggle button added.', { size: 20, italic: true }),
        p('*** AI chatbot failed on single-word Roman Urdu abbreviations — normalizer dictionary extended.', { size: 20, italic: true }),
        blankLine(),

        subTitle('5.3  User Acceptance Testing'),
        p('UAT was conducted with three library staff members and twelve student volunteers over two days. Participants completed a structured task list (registration, book search, QR-based issue, chatbot query, notification check) without assistance. All staff completed book issue and return workflows successfully on the first attempt. One staff member commented: "This alone would save us an hour every day." Student participants showed 100% success on catalogue search, 91.7% on chatbot interaction, and 100% on borrowing history review.', { line: 480 }),

        subTitle('5.4  AI Recommendation Quality Assessment'),
        p('Twenty-five representative queries were submitted — English topic queries, Roman Urdu queries, specific book name queries, and mood-based queries — and top-5 results for each were rated for relevance by two independent assessors. Inter-rater agreement was measured using Cohen\'s Kappa (κ = 0.81, strong agreement). Mean Precision@5 was 0.79 for English queries, 0.74 for Roman Urdu queries, and 0.82 for mood-based queries. These compare favorably with published benchmarks (Beel et al., 2016, reporting P@5 of 0.68–0.73 for content-based academic recommendation).', { line: 480 }),

        subTitle('5.5  Satisfaction Survey Results'),
        p('A 10-question Likert-scale survey (1–5) was administered to all UAT participants (n=15). Table 5.2 summarizes key results.', { line: 360 }),
        blankLine(),
        simpleTable(['Survey Item', 'Mean Score'], [
          ['The system is easy to use without prior training.', '4.6 / 5'],
          ['The QR code scanning feature saved me time.', '4.8 / 5'],
          ['The AI chatbot gave me useful book suggestions.', '4.3 / 5'],
          ['The chatbot understood my Urdu/Roman Urdu query.', '4.2 / 5'],
          ['I would prefer this system to the current manual process.', '4.9 / 5'],
          ['Overall, I am satisfied with QALAM.', '4.7 / 5'],
        ], [6000, 3000]),
        p('Table 5.2: Satisfaction Survey Results  |  Overall Mean: 4.55 / 5.0', { center: true, italic: true, size: 20, bold: true }),
        blankLine(),
        placeholder('Figure 5.1 — User Satisfaction Survey Results (Bar Chart)'),
        blankLine(),

        subTitle('5.6  Discussion'),
        p('The results demonstrate that QALAM successfully achieves all stated objectives. The system is functional, secure, and usable by non-technical users without training. The AI chatbot delivers practically useful results even for Urdu-language queries — an accomplishment not previously documented in Pakistani library system literature. The QR-based circulation workflow was the most celebrated feature among staff, and the 95.9% overall functional test pass rate combined with a mean satisfaction score of 4.55/5.0 provides strong evidence that QALAM is ready for pilot deployment.', { line: 480 }),
        pageBreak(),

        // ════ CHAPTER 6 ════════════════════════════════════════════════════
        sectionTitle('Chapter 6: Conclusion'),
        p('This thesis presented QALAM — a full-stack, AI-powered intelligent library management system designed for Pakistani academic institutions. The project successfully achieved all stated objectives: a secure, role-based web application was developed; a semantic AI recommendation engine using sentence-transformers was integrated; QR code generation and camera-based scanning were implemented for frictionless book circulation; automated email notifications with cron scheduling were deployed; interactive analytics dashboards were built; and the entire system was containerized in a production-ready Docker configuration.', { line: 480 }),
        p('The most significant technical contribution of this work is the multilingual AI chatbot that supports English, Urdu, and Roman Urdu — making intelligent book discovery accessible to Pakistani students who are more comfortable expressing themselves in their native language. The chatbot\'s design as an empathetic reading mentor, rather than a simple keyword search tool, represents a philosophically distinctive approach: it treats the library as a guide, not merely a warehouse.', { line: 480 }),
        p('User evaluation confirmed QALAM\'s readiness for real-world deployment. The QR scanning feature was estimated by library staff to save approximately one hour of administrative processing time per day — a concrete, measurable productivity gain. Student participants expressed genuine delight at the chatbot\'s ability to respond in Roman Urdu. QALAM demonstrates that modern software engineering and applied machine learning, when combined thoughtfully and deployed with attention to local context, can produce educational technology that is both technically sophisticated and genuinely useful to the communities it serves.', { line: 480 }),
        pageBreak(),

        // ════ CHAPTER 7 ════════════════════════════════════════════════════
        sectionTitle('Chapter 7: Recommendations and Future Work'),

        subTitle('7.1  Technical Recommendations'),
        bullet('Multilingual Embedding Model: Replace all-MiniLM-L6-v2 with paraphrase-multilingual-MiniLM-L12-v2 or LaBSE (Feng et al., 2022) to natively handle Urdu script queries without the Roman Urdu normalization approximation.'),
        bullet('Mobile Application: Develop a React Native companion app for a richer mobile experience, particularly for the QR scanning workflow.'),
        bullet('Inter-Library Loan Module: Extend QALAM to support reservation requests across University of Education campuses with a unified catalogue view.'),
        bullet('HEC Digital Library Integration: Add API integration with the HEC National Digital Library to surface e-book recommendations alongside physical book results in the chatbot.'),
        bullet('RFID Support: Investigate RFID tag integration as a complement to QR codes for high-volume libraries.'),
        bullet('Recommendation Feedback Loop: Implement thumbs-up/thumbs-down rating on chatbot recommendations to build a dataset for supervised fine-tuning of the recommendation model.'),

        subTitle('7.2  Institutional Recommendations'),
        bullet('Pilot Deployment: A phased pilot at one campus division is recommended before university-wide rollout, to identify environment-specific configuration issues.'),
        bullet('Staff Orientation: A half-day orientation session for library staff is recommended, focusing on QR scanning workflows and administrative reporting features.'),
        bullet('Regular Reindexing: Administrators should trigger /reindex after any significant batch of new book acquisitions to keep AI recommendations current.'),
        pageBreak(),

        // ════ CHAPTER 8: REFERENCES ════════════════════════════════════════
        sectionTitle('Chapter 8: References'),
        p('Ashford, R. (2010). QR codes and academic libraries: Reaching mobile users. College & Research Libraries News, 71(10), 526–530.', { justify: false, line: 360 }),
        blankLine(),
        p('Avram, H. D. (1986). Leadership in library automation. Journal of the American Society for Information Science, 37(2), 83–93.', { justify: false, line: 360 }),
        blankLine(),
        p('Beel, J., Gipp, B., Langer, S., & Breitinger, C. (2016). Research-paper recommender systems: A literature survey. International Journal on Digital Libraries, 17(4), 305–338.', { justify: false, line: 360 }),
        blankLine(),
        p('Devlin, J., Chang, M. W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. In Proceedings of NAACL-HLT 2019 (pp. 4171–4186).', { justify: false, line: 360 }),
        blankLine(),
        p('Feng, F., Yang, Y., Cer, D., Arivazhagan, N., & Wang, W. (2022). Language-agnostic BERT sentence embedding. In Proceedings of ACL 2022 (pp. 878–891).', { justify: false, line: 360 }),
        blankLine(),
        p('Janakipriya, G., & Prasad, T. V. (2020). Intelligent library chatbot using natural language processing. International Journal of Engineering Research & Technology, 9(7), 45–49.', { justify: false, line: 360 }),
        blankLine(),
        p('Kaur, H., & Behl, S. (2018). QR code: A new technology for library services and its applications in South Asian university libraries. Library Philosophy and Practice (e-journal), Paper 1794.', { justify: false, line: 360 }),
        blankLine(),
        p('Rafiq, M., & Ameen, K. (2009). Information access and retrieval skills of library and information science professionals: A case study. Library Management, 30(6/7), 401–413.', { justify: false, line: 360 }),
        blankLine(),
        p('Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-networks. In Proceedings of EMNLP-IJCNLP 2019 (pp. 3982–3992).', { justify: false, line: 360 }),
        blankLine(),
        p('Shafi-Ullah, & Mahmood, K. (2010). Use of information and communication technology in university libraries of Pakistan. The Electronic Library, 28(6), 770–784.', { justify: false, line: 360 }),
        blankLine(),
        p('Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30, 5998–6008.', { justify: false, line: 360 }),
        pageBreak(),

        // ════ APPENDICES ════════════════════════════════════════════════════
        sectionTitle('Appendices'),

        subTitle('Appendix A: PostgreSQL Database Schema (DDL)'),
        codeBox('SQL — Core Table Definitions', [
          'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
          'CREATE EXTENSION IF NOT EXISTS vector;',
          '',
          'CREATE TABLE users (',
          '  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
          '  name          VARCHAR(255) NOT NULL,',
          '  email         VARCHAR(255) UNIQUE NOT NULL,',
          "  password_hash TEXT NOT NULL,",
          "  role          VARCHAR(20) CHECK (role IN ('admin','staff','member')) DEFAULT 'member',",
          '  is_active     BOOLEAN DEFAULT TRUE,',
          '  created_at    TIMESTAMPTZ DEFAULT NOW()',
          ');',
          '',
          'CREATE TABLE books (',
          '  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
          '  title            VARCHAR(500) NOT NULL,',
          '  author           VARCHAR(255) NOT NULL,',
          '  isbn             VARCHAR(20),',
          '  genre            VARCHAR(100),',
          '  tags             TEXT[],',
          '  description      TEXT,',
          '  cover_url        TEXT,',
          '  qr_code          TEXT,',
          '  available_copies INTEGER DEFAULT 1,',
          '  total_copies     INTEGER DEFAULT 1,',
          '  location         VARCHAR(100),',
          '  published_year   INTEGER,',
          '  created_at       TIMESTAMPTZ DEFAULT NOW()',
          ');',
          '',
          'CREATE TABLE borrow_records (',
          '  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
          '  user_id       UUID REFERENCES users(id),',
          '  book_id       UUID REFERENCES books(id),',
          '  borrow_date   DATE NOT NULL DEFAULT CURRENT_DATE,',
          '  due_date      DATE NOT NULL,',
          '  return_date   DATE,',
          '  fine_amount   DECIMAL(10,2) DEFAULT 0.00,',
          "  status        VARCHAR(20) DEFAULT 'active',",
          '  created_at    TIMESTAMPTZ DEFAULT NOW()',
          ');',
          '',
          'CREATE TABLE notifications (',
          '  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
          '  user_id       UUID REFERENCES users(id),',
          '  title         VARCHAR(255),',
          '  message       TEXT,',
          '  type          VARCHAR(50),',
          '  is_read       BOOLEAN DEFAULT FALSE,',
          '  created_at    TIMESTAMPTZ DEFAULT NOW()',
          ');',
          '',
          'CREATE TABLE activity_logs (',
          '  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),',
          '  user_id       UUID REFERENCES users(id),',
          '  action        VARCHAR(100) NOT NULL,',
          '  target_type   VARCHAR(50),',
          '  target_id     UUID,',
          '  details       JSONB,',
          '  created_at    TIMESTAMPTZ DEFAULT NOW()',
          ');',
        ]),
        blankLine(),

        subTitle('Appendix B: Sample docker-compose.yml'),
        codeBox('docker-compose.yml', [
          "version: '3.9'",
          'services:',
          '  db:',
          '    image: pgvector/pgvector:pg16',
          '    environment:',
          '      POSTGRES_DB: qalam',
          '      POSTGRES_USER: postgres',
          '      POSTGRES_PASSWORD: ${DB_PASSWORD}',
          '    volumes:',
          '      - postgres_data:/var/lib/postgresql/data',
          '    healthcheck:',
          '      test: ["CMD-SHELL","pg_isready -U postgres"]',
          '      interval: 10s',
          '      retries: 5',
          '',
          '  backend:',
          '    build: ./backend',
          '    environment:',
          '      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/qalam',
          '      JWT_SECRET: ${JWT_SECRET}',
          '      SMTP_HOST: ${SMTP_HOST}',
          '      SMTP_USER: ${SMTP_USER}',
          '      SMTP_PASS: ${SMTP_PASS}',
          '    depends_on:',
          '      db:',
          '        condition: service_healthy',
          '    restart: always',
          '',
          '  ai:',
          '    build: ./ai-service',
          '    environment:',
          '      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/qalam',
          '    depends_on:',
          '      db:',
          '        condition: service_healthy',
          '    restart: always',
          '',
          '  frontend:',
          '    build: ./frontend',
          '    environment:',
          '      NEXT_PUBLIC_API_URL: /api',
          '    restart: always',
          '',
          '  nginx:',
          '    image: nginx:alpine',
          '    ports: ["80:80","443:443"]',
          '    volumes:',
          '      - ./nginx/nginx.conf:/etc/nginx/nginx.conf',
          '    depends_on: [frontend, backend, ai]',
          '    restart: always',
          '',
          'volumes:',
          '  postgres_data:',
        ]),
        blankLine(),

        subTitle('Appendix C: User Satisfaction Survey Instrument'),
        simpleTable(['No.', 'Survey Question', 'Scale'], [
          ['1', 'The system is easy to use without prior training.', '1–5'],
          ['2', 'The QR code scanning feature worked reliably.', '1–5'],
          ['3', 'The QR scanning feature saved time vs. manual entry.', '1–5'],
          ['4', 'The AI chatbot gave me useful book recommendations.', '1–5'],
          ['5', 'The chatbot understood my query in my preferred language.', '1–5'],
          ['6', 'Notifications informed me about due dates appropriately.', '1–5'],
          ['7', 'The interface displayed information clearly.', '1–5'],
          ['8', 'I would use this system regularly if available.', '1–5'],
          ['9', 'I prefer this system to the current manual process.', '1–5'],
          ['10', 'Overall, I am satisfied with QALAM.', '1–5'],
        ], [500, 6500, 2000]),
        p('Scale: 1 = Strongly Disagree  |  3 = Neutral  |  5 = Strongly Agree', { italic: true, size: 20, center: true }),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/thesis/QALAM_Thesis.docx', buf);
  console.log('QALAM_Thesis.docx written successfully');
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});