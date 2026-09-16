import { Question } from '../models/types';

export function exportSessionToPrint(
  baseName: string,
  questions: Question[],
  mode: 'study' | 'compendium'
) {
  if (!questions || questions.length === 0) return;

  // Generuj HTML
  const html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <title>${baseName} - Arkusz Nauki</title>
      <style>
        :root {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
        }
        
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        body {
          margin: 0;
          color: #18181b; /* zinc-900 */
          font-size: 11pt;
          line-height: 1.4;
        }
        
        h1 {
          font-size: 18pt;
          margin-bottom: 0.5cm;
          padding-bottom: 0.25cm;
          border-bottom: 2px solid #e4e4e7;
          letter-spacing: -0.02em;
        }
        
        .meta {
          font-size: 9pt;
          color: #71717a;
          margin-bottom: 1cm;
        }
        
        .question-block {
          margin-bottom: 0.8cm;
          page-break-inside: avoid;
        }
        
        .question-title {
          font-weight: 600;
          margin-bottom: 0.2cm;
        }
        
        .answers {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }
        
        .answer-item {
          display: flex;
          margin-bottom: 0.1cm;
          align-items: flex-start;
        }
        
        .answer-letter {
          font-weight: 600;
          width: 0.8cm;
          flex-shrink: 0;
        }
        
        .correct-answer {
          font-weight: 600;
          color: #16a34a;
          background-color: #dcfce7;
          padding: 2px 4px;
          border-radius: 4px;
        }
        
        .key-table-page {
          page-break-before: always;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1cm;
        }
        
        th, td {
          border: 1px solid #e4e4e7;
          padding: 8px;
          text-align: left;
          font-size: 10pt;
        }
        
        th {
          background-color: #f4f4f5;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <h1>${baseName}</h1>
      <div class="meta">Wygenerowano z Testownika | Liczba pytań: ${questions.length}</div>
      
      <div class="questions-container">
        ${questions.map((q, i) => {
          const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];
          return `
            <div class="question-block">
              <div class="question-title">${i + 1}. ${q.text.replace(/\n/g, '<br/>')}</div>
              <ul class="answers">
                ${q.answers.map((a, j) => {
                  const isCorrect = mode === 'compendium' && a.isCorrect;
                  return `
                    <li class="answer-item ${isCorrect ? 'correct-answer' : ''}">
                      <span class="answer-letter">${letterMap[j] || '•'}.</span>
                      <span>${a.text}</span>
                    </li>
                  `;
                }).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>

      ${mode === 'study' ? `
        <div class="key-table-page">
          <h2>Klucz odpowiedzi</h2>
          <table>
            <thead>
              <tr>
                <th width="10%">Nr</th>
                <th>Poprawne odpowiedzi</th>
              </tr>
            </thead>
            <tbody>
              ${questions.map((q, i) => {
                const letterMap = ['A', 'B', 'C', 'D', 'E', 'F'];
                const correctLetters = q.answers
                  .map((a, j) => a.isCorrect ? letterMap[j] : null)
                  .filter(Boolean)
                  .join(', ');
                return `
                  <tr>
                    <td><strong>${i + 1}</strong></td>
                    <td>${correctLetters}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Zapewniamy czas na wyrenderowanie fontów i CSS
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  }
}
