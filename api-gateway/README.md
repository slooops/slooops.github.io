# FastAPI Subscription Chat Backend

This directory contains the FastAPI backend server for the subscription chat interface.

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your Cisco LLM credentials:

```bash
copy .env.example .env
```

Edit `.env` and set your Cisco credentials:
- `LLM_CLIENT_ID`: Your Cisco OAuth2 client ID
- `LLM_CLIENT_SECRET`: Your Cisco OAuth2 client secret
- `LLM_APP_KEY`: Your Cisco LLM application key

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`

## API Endpoints

### POST /api/chat
Main chat endpoint that processes user messages and returns LLM responses.

**Request Body:**
```json
{
  "message": "What's my total subscription revenue?",
  "context": "Optional context about current subscription data",
  "conversation_history": [
    {
      "role": "user", 
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous AI response"
    }
  ]
}
```

**Response:**
```json
{
  "response": "AI generated response",
  "suggestions": ["Follow-up suggestion 1", "Follow-up suggestion 2"]
}
```

### GET /api/health
Health check endpoint.

### GET /api/config/check
Checks if all required environment variables are properly configured.

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **LangChain**: Framework for developing applications with LLMs
- **Azure OpenAI**: Cisco's LLM service integration
- **CORS**: Configured to allow requests from frontend (localhost:5173, localhost:3000)

## Security

- Environment variables for sensitive credentials
- OAuth2 authentication with Cisco identity service
- Error handling for failed authentication attempts
- Request validation using Pydantic models

## Error Handling

The API includes comprehensive error handling for:
- Missing environment variables
- Failed authentication with Cisco services
- Network connectivity issues
- Invalid request formats
- LLM service failures

## Development

The server runs in reload mode by default, so changes to the code will automatically restart the server during development.