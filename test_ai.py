import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'ai_service'))
os.environ['APPWRITE_AVAILABLE'] = 'False'

from ai_service.main import get_ai_tips, get_task_suggestions

async def run_tests():
    print("Testing /ai/tips...")
    try:
        tips = await get_ai_tips("demo-user")
        print("TIPS RESPONSE:")
        print(tips)
    except Exception as e:
        print(f"Error testing tips: {e}")

    print("\nTesting /ai/task-suggestions...")
    try:
        suggestions = await get_task_suggestions("demo-user")
        print("SUGGESTIONS RESPONSE:")
        print(suggestions)
    except Exception as e:
        print(f"Error testing suggestions: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
