import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendActionConfirmationEmail } from '@/lib/email';

const prisma = new PrismaClient();

// Handle approval/rejection actions via email link
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; action: string } }
) {
  try {
    const { token, action } = params;

    if (!token || (action !== 'approve' && action !== 'reject')) {
      const acceptsJson = request.headers.get('accept')?.includes('application/json');
      if (acceptsJson) {
        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
      }
      return new NextResponse(getErrorHTML('Invalid request'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Find training request by token
    const tokenField = action === 'approve' ? 'approveToken' : 'rejectToken';
    const trainingRequest = await prisma.trainingRequest.findFirst({
      where: { [tokenField]: token },
      include: {
        employee: true,
        workshopManager: true,
      },
    });

    if (!trainingRequest) {
      const acceptsJson = request.headers.get('accept')?.includes('application/json');
      if (acceptsJson) {
        return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 404 });
      }
      return new NextResponse(getErrorHTML('Invalid or expired token'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check if already processed
    if (trainingRequest.status === 'APPROVED' || trainingRequest.status === 'REJECTED') {
      const acceptsJson = request.headers.get('accept')?.includes('application/json');
      if (acceptsJson) {
        return NextResponse.json({
          success: false,
          error: `Already ${trainingRequest.status.toLowerCase()}`,
          status: trainingRequest.status
        }, { status: 200 });
      }
      return new NextResponse(
        getAlreadyProcessedHTML(trainingRequest.employee.name, trainingRequest.status),
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Update status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await prisma.trainingRequest.update({
      where: { id: trainingRequest.id },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
    });

    // If approved, update employee training level to BASIC or schedule for training
    if (action === 'approve') {
      await prisma.employee.update({
        where: { id: trainingRequest.employeeId },
        data: {
          trainingLevel: 'BASIC',
        },
      });
    }

    // Send confirmation email to WM
    if (trainingRequest.workshopManager?.email) {
      await sendActionConfirmationEmail(
        trainingRequest.workshopManager.email,
        trainingRequest.employee.name,
        action === 'approve' ? 'approved' : 'rejected'
      );
    }

    // Check if client wants JSON response (for AJAX calls from Quick Approve)
    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    if (acceptsJson) {
      return NextResponse.json({
        success: true,
        action,
        employeeName: trainingRequest.employee.name,
        status: newStatus
      });
    }

    // Return success page for direct browser access
    return new NextResponse(
      getSuccessHTML(trainingRequest.employee.name, action, trainingRequest.workshopManager?.name),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error: any) {
    console.error('Error processing action:', error);
    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    if (acceptsJson) {
      return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
    return new NextResponse(getErrorHTML('An error occurred while processing your request'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// HTML templates for response pages
function getSuccessHTML(employeeName: string, action: string, wmName?: string): string {
  const actionText = action === 'approve' ? 'Approved' : 'Rejected';
  const actionColor = action === 'approve' ? '#4CAF50' : '#f44336';
  const icon = action === 'approve' ? '✓' : '✗';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Training Request ${actionText}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .icon {
      width: 80px;
      height: 80px;
      background: ${actionColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 48px;
      color: white;
      font-weight: bold;
      animation: pulse 0.5s ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    h1 {
      color: ${actionColor};
      margin-bottom: 10px;
    }
    .employee-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin: 20px 0;
    }
    .message {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .close-info {
      color: #999;
      font-size: 14px;
      font-style: italic;
    }
  </style>
  <script>
    // Auto-close after 2 seconds
    setTimeout(() => {
      window.close();
      // If window.close() doesn't work (some browsers block it), show message
      setTimeout(() => {
        const elem = document.querySelector('.close-info');
        if (elem) elem.textContent = 'You can now close this window';
      }, 500);
    }, 2000);
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>Training Request ${actionText}</h1>
    <div class="employee-name">${employeeName}</div>
    <div class="message">
      ${action === 'approve'
      ? `You have successfully approved the training request. The employee will be scheduled for basic training.`
      : `You have rejected the training request. No further action is required.`
    }
      ${wmName ? `<br><br>Confirmed by: ${wmName}` : ''}
    </div>
    <div class="close-info">This window will close automatically...</div>
  </div>
</body>
</html>
  `.trim();
}

function getErrorHTML(message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    h1 {
      color: #f44336;
      margin-bottom: 20px;
    }
    .message {
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Error</h1>
    <div class="message">${message}</div>
  </div>
</body>
</html>
  `.trim();
}

function getAlreadyProcessedHTML(employeeName: string, status: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Already Processed</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    h1 {
      color: #FF9800;
      margin-bottom: 20px;
    }
    .message {
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">ℹ️</div>
    <h1>Already Processed</h1>
    <div class="message">
      The training request for <strong>${employeeName}</strong> has already been <strong>${status.toLowerCase()}</strong>.
      <br><br>
      No further action is required.
    </div>
  </div>
</body>
</html>
  `.trim();
}
