import json
import boto3
from botocore.exceptions import ClientError

ses = boto3.client('ses', region_name='us-east-1')
TO_EMAIL = 'web@jamestannahill.com'
FROM_EMAIL = 'web@jamestannahill.com'

def handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': 'https://www.jamestannahill.com',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    }

    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        first = body.get('firstName', '').strip()
        last = body.get('lastName', '').strip()
        email = body.get('email', '').strip()
        phone = body.get('phone', '').strip()
        subject = body.get('subject', '(no subject)').strip()
        message = body.get('message', '').strip()

        if not first or not email or not message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'firstName, email, and message are required'}),
            }

        body_text = f"""New contact form submission from jamestannahill.com

Name: {first} {last}
Email: {email}
Phone: {phone or 'not provided'}
Subject: {subject}

Message:
{message}
"""

        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [TO_EMAIL]},
            Message={
                'Subject': {'Data': f'[jamestannahill.com] {subject}'},
                'Body': {'Text': {'Data': body_text}},
            },
            ReplyToAddresses=[email],
        )

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True}),
        }

    except ClientError as e:
        print(f'SES error: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to send email'}),
        }
