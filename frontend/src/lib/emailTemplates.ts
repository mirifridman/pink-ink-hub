// Base template wrapper for all emails
export function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          direction: rtl;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .content p {
          line-height: 1.8;
          color: #333;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white !important;
          padding: 16px 48px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          background: #F9FAFB;
          padding: 20px 30px;
          text-align: center;
          color: #6B7280;
          font-size: 14px;
        }
        .badge {
          display: inline-block;
          background: #FEF3C7;
          color: #92400E;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: bold;
        }
        .alert {
          background: #FEE2E2;
          border-right: 4px solid #EF4444;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .success-box {
          background: #F0FDF4;
          border-right: 4px solid #22C55E;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background: #EFF6FF;
          border-right: 4px solid #3B82F6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .stat-box {
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-number {
          font-size: 32px;
          font-weight: bold;
        }
        ul {
          padding-right: 20px;
        }
        li {
          margin: 10px 0;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

// תזכורת דדליין
export interface DeadlineReminderData {
  editorName: string;
  issueName: string;
  contentItems: Array<{ title: string; pages: string }>;
  deadline: string;
  daysLeft: number;
}

export function deadlineReminderTemplate(data: DeadlineReminderData): string {
  const urgencyClass = data.daysLeft <= 1 ? 'alert' : 'info-box';
  const urgencyEmoji = data.daysLeft <= 1 ? '🚨' : '⏰';
  
  const content = `
    <div class="container">
      <div class="header">
        <h1>${urgencyEmoji} תזכורת דדליין</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.editorName},</strong></p>
        
        <p>זוהי תזכורת שיש לך תכנים לגיליון <strong>${data.issueName}</strong> שממתינים להעלאה.</p>
        
        <div class="${urgencyClass}">
          <p style="margin: 0;">
            <strong>⏰ דדליין:</strong> ${new Date(data.deadline).toLocaleDateString('he-IL')}
            ${data.daysLeft > 0 ? `(עוד ${data.daysLeft} ימים)` : data.daysLeft === 0 ? '(היום!)' : `(באיחור של ${Math.abs(data.daysLeft)} ימים!)`}
          </p>
        </div>

        <h3>📝 תכנים שצריך להעלות:</h3>
        <ul>
          ${data.contentItems.map(item => 
            `<li><strong>${item.title}</strong> - עמודים ${item.pages}</li>`
          ).join('')}
        </ul>

        <div style="text-align: center;">
          <a href="https://magazinepro.app/lineup" class="button">
            כנס למערכת
          </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          💡 <strong>טיפ:</strong> כדי להימנע מתזכורות, העלה את התכנים למערכת לפני הדדליין.
        </p>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
        <p>שלחנו לך את המייל הזה כי יש לך משימות ממתינות</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// אישור העלאת תוכן
export interface ContentUploadedData {
  editorName: string;
  issueName: string;
  contentTitle: string;
  contentType: string;
  pages: string;
}

export function contentUploadedTemplate(data: ContentUploadedData): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>✅ התוכן התקבל בהצלחה!</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.editorName},</strong></p>
        
        <p>התוכן שלך עבור גיליון <strong>${data.issueName}</strong> התקבל בהצלחה במערכת!</p>

        <div class="success-box">
          <p style="margin: 5px 0;"><strong>📄 כותרת:</strong> ${data.contentTitle}</p>
          <p style="margin: 5px 0;"><strong>📁 סוג:</strong> <span class="badge">${data.contentType}</span></p>
          <p style="margin: 5px 0;"><strong>📖 עמודים:</strong> ${data.pages}</p>
        </div>

        <p>✨ תודה על העבודה המצוינת! הצוות שלנו יבדוק את התוכן בקרוב.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://magazinepro.app/lineup" class="button">
            צפה במשימות הבאות שלך
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// גיליון חדש נוצר
export interface NewIssueData {
  editorName: string;
  issueName: string;
  issueNumber: number;
  theme: string;
  startDate: string;
  deadline: string;
}

export function newIssueTemplate(data: NewIssueData): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>🎉 גיליון חדש נוצר!</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.editorName},</strong></p>
        
        <p>גיליון חדש נוסף למערכת ומחכה לך!</p>

        <div class="info-box">
          <p style="margin: 5px 0;"><strong>📰 שם הגיליון:</strong> ${data.issueName}</p>
          <p style="margin: 5px 0;"><strong>#️⃣ מספר גיליון:</strong> ${data.issueNumber}</p>
          <p style="margin: 5px 0;"><strong>🎯 נושא:</strong> ${data.theme}</p>
          <p style="margin: 5px 0;"><strong>📅 תחילת עבודה:</strong> ${new Date(data.startDate).toLocaleDateString('he-IL')}</p>
          <p style="margin: 5px 0;"><strong>⏰ דדליין להדפסה:</strong> ${new Date(data.deadline).toLocaleDateString('he-IL')}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://magazinepro.app/issues" class="button">
            צפה בגיליון
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// דוח שבועי
export interface WeeklyReportData {
  managerName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    activeIssues: number;
    completedContent: number;
    pendingContent: number;
    lateContent: number;
  };
  upcomingDeadlines: Array<{
    issueName: string;
    deadline: string;
    daysLeft: number;
  }>;
}

export function weeklyReportTemplate(data: WeeklyReportData): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>📊 דו"ח שבועי</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">
          ${data.weekStart} - ${data.weekEnd}
        </p>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.managerName},</strong></p>
        
        <p>הנה סיכום השבוע במערכת:</p>

        <h3>📈 סטטיסטיקות</h3>
        <div class="stats-grid">
          <div class="stat-box" style="background: #DBEAFE;">
            <div class="stat-number" style="color: #1E40AF;">
              ${data.stats.activeIssues}
            </div>
            <div style="color: #1E40AF;">גיליונות פעילים</div>
          </div>
          
          <div class="stat-box" style="background: #D1FAE5;">
            <div class="stat-number" style="color: #065F46;">
              ${data.stats.completedContent}
            </div>
            <div style="color: #065F46;">תכנים הושלמו</div>
          </div>
          
          <div class="stat-box" style="background: #FEF3C7;">
            <div class="stat-number" style="color: #92400E;">
              ${data.stats.pendingContent}
            </div>
            <div style="color: #92400E;">ממתינים</div>
          </div>
          
          <div class="stat-box" style="background: #FEE2E2;">
            <div class="stat-number" style="color: #991B1B;">
              ${data.stats.lateContent}
            </div>
            <div style="color: #991B1B;">באיחור</div>
          </div>
        </div>

        ${data.upcomingDeadlines.length > 0 ? `
          <h3>📅 דדליינים מתקרבים</h3>
          <ul>
            ${data.upcomingDeadlines.map(d => `
              <li>
                <strong>${d.issueName}</strong> - 
                ${new Date(d.deadline).toLocaleDateString('he-IL')}
                (עוד ${d.daysLeft} ימים)
              </li>
            `).join('')}
          </ul>
        ` : ''}

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://magazinepro.app" class="button">
            צפה בדשבורד
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
        <p>דו"ח זה נוצר אוטומטית כל יום ראשון בבוקר</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// הקצאת משימה לספק
export interface AssignmentSentData {
  supplierName: string;
  editorName: string;
  issueName: string;
  contentTitle: string;
  pages: string;
  deadline: string;
  notes?: string;
}

export function assignmentSentTemplate(data: AssignmentSentData): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>📋 משימה חדשה עבורך</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.supplierName},</strong></p>
        
        <p>קיבלת משימה חדשה מ<strong>${data.editorName}</strong> עבור גיליון <strong>${data.issueName}</strong>.</p>

        <div class="info-box">
          <p style="margin: 5px 0;"><strong>📄 תוכן:</strong> ${data.contentTitle}</p>
          <p style="margin: 5px 0;"><strong>📖 עמודים:</strong> ${data.pages}</p>
          <p style="margin: 5px 0;"><strong>⏰ דדליין:</strong> ${new Date(data.deadline).toLocaleDateString('he-IL')}</p>
          ${data.notes ? `<p style="margin: 5px 0;"><strong>📝 הערות:</strong> ${data.notes}</p>` : ''}
        </div>

        <p>אנא העלה את התוכן למערכת עד לתאריך הדדליין.</p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://magazinepro.app" class="button">
            כנס למערכת
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// תזכורת כללית
export interface GeneralReminderData {
  recipientName: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function generalReminderTemplate(data: GeneralReminderData): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>🔔 ${data.title}</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${data.recipientName},</strong></p>
        
        <p>${data.message}</p>

        ${data.ctaText && data.ctaUrl ? `
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.ctaUrl}" class="button">
              ${data.ctaText}
            </a>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}

// Test email template
export function testEmailTemplate(recipientName: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <h1>🧪 בדיקת מערכת מיילים</h1>
      </div>
      
      <div class="content">
        <p><strong>שלום ${recipientName},</strong></p>
        
        <p>זהו מייל בדיקה ממערכת מגזין פרו.</p>
        
        <div class="success-box">
          <p style="margin: 0;">✅ אם אתה רואה את ההודעה הזו, מערכת המיילים עובדת כראוי!</p>
        </div>

        <p>תאריך ושעה: ${new Date().toLocaleString('he-IL')}</p>
      </div>
      
      <div class="footer">
        <p>מגזין פרו - מערכת ניהול הפקה</p>
      </div>
    </div>
  `;
  
  return baseTemplate(content);
}
