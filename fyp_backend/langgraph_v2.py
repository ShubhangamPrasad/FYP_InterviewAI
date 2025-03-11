import os
import operator
from openai import AzureOpenAI
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated, Dict, List

# Initialize Azure OpenAI client
endpoint = "https://aiview-azureopenai.openai.azure.com"
key = "EGyCt6tCmsRzncdBPLYHV5Mqzxvb87e7DbloT6fVvtxVjYXDNz6IJQQJ99BAACHYHv6XJ3w3AAABACOGlGqe"

class State(TypedDict):
    input: Annotated[List[dict], operator.add]  # Stores previous discussions as list of JSON objects
    decision: Annotated[List[str], operator.add]  # Allows multiple decisions per execution step
    output: Annotated[List[str], operator.add]  # Stores only the latest response

# Initialize StateGraph with the correct state schema
workflow = StateGraph(State)

# Initialize Azure OpenAI client
client = AzureOpenAI(
  azure_endpoint=endpoint, 
  api_key=key,  
  api_version="2024-02-01"
)

def node3(state: State) -> State:
    input_data = state["input"][-1]  # Take the latest input only
    prompt = f"""
        You are an interviewer taking a SWE interview. You've just received a JSON input containing four things: 
        - Interview question
        - Summary of past response
        - New code written
        - User's input

        The input is: {input_data} 

        Based on this, classify the user's response into one of the following categories:
        1 → User is confused and needs some guidance
        2 → User has a question and needs clarification
        3 → User has provided a response and needs feedback

        **Output only the number (1, 2, or 3) with no additional text, explanation, or formatting.**
    """

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    decision = response.choices[0].message.content.strip()

    print("Decision is " + decision)
    state["decision"].append(decision)
    return state

def router(state: State) -> Dict:
    decision = state["decision"][-1]  # Take the latest decision
    
    if decision == "1":
        return {"next": "node_4"}
    elif decision == "2":
        return {"next": "node_5"}
    elif decision == "3":
        return {"next": "node_6"}
    else:
        return {"next": "node_7"}

def node4(state: State) -> State:
    input_data = state["input"][-1]
    prompt = f"This is the summary of what the user has done and said in the interview thus far '{input_data}'.\
    The user is confused and needs some guidance. Provide the user with some guidance questions on how to proceed without giving them the answer. \
    Remember this is a conversation, so leave room for further discussion. \
        Make sure you are concise in your response!"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": prompt}]
    )

    state["output"] = [response.choices[0].message.content]
    return state

def node5(state: State) -> State:
    input_data = state["input"][-1]
    prompt = f"This is the summary of what the user has done and said in the interview thus far '{input_data}'.\
    The user has a specific question they'd like answered. Provide a question similar to what an interviewer \
    might ask, without giving them any new information. Leave room for further discussion.\
    If you look at past summary and you feel like the user has not written any code, encourage them to start writing.\
        Make sure you are concise in your response!"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": prompt}]
    )

    state["output"] = [response.choices[0].message.content]
    return state

def node6(state: State) -> State:
    input_data = state["input"][-1]
    prompt = f"This is the summary of what the user has done and said in the interview thus far '{input_data}'.\
    The user has given a response. Evaluate if their response is correct. \
    If the answer is good but there is no code written, encourage them to start writing. \
    If code has been written and its accurate then slightly modify the question parameters for a harder challenge. \
    Otherwise, provide constructive feedback and conclude the interview.\
        Make sure you are concise in your response!"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": prompt}]
    )

    state["output"] = [response.choices[0].message.content]
    return state

def node7(state: State) -> State:
    print("Interview is ending...")
    state["output"] = ["Goodbye!"]
    return state

# Add nodes to the workflow
workflow.add_node("node_3", node3)
workflow.add_node("router", router)
workflow.add_node("node_4", node4)
workflow.add_node("node_5", node5)
workflow.add_node("node_6", node6)
workflow.add_node("node_7", node7)

# Route decisions properly
workflow.add_edge("node_3", "router")
workflow.add_conditional_edges(
    "router",
    lambda state: state["next"],
    {
        "node_4": "node_4",
        "node_5": "node_5",
        "node_6": "node_6",
        "node_7": "node_7"
    }
)

# Set entry and termination points
workflow.set_entry_point("node_3")
workflow.set_finish_point("node_7")

# Compile workflow
app = workflow.compile()

# Initial state with a question
initial_state = {
    "input": [
        {
            "interview_question": "Given an unsorted array of integers, return the k smallest elements in sorted order. You may use any sorting algorithm of your choice, but aim for an efficient approach.",
            "summary_of_past_response": "The user has just started and has not written any code yet.",
            "new_code_written": "",
            "user_input": "I'm not sure where to start. Should I sort the whole array first, or is there a more optimal way to find the k smallest elements?"
        }
    ],
    "decision": [],
    "output": []
}


# Start continuous interview loop
current_state = initial_state

import json
import time

# Initialize interview timing
start_time = time.time()  # Record start time
max_duration = 20 * 60  # 20 minutes in seconds
user_input_time = 1.5 * 60  # 1.5 minutes per user input

while True:
    # Calculate elapsed time
    elapsed_time = time.time() - start_time

    # If interview exceeds max duration, end it
    if elapsed_time >= max_duration:
        print("Bot: We've reached the end of our time for this interview. Great job! Looking forward to our next session.")
        break

    # Invoke workflow with current state
    result_state = app.invoke(current_state)

    # Ensure there is an output response
    bot_response = result_state.get("output", ["No response"])[-1]

    # Print latest output
    print("Bot:", bot_response)
    print(f"⏳ Interview Time Elapsed: {elapsed_time // 60:.0f} min {elapsed_time % 60:.0f} sec")
    print("________________________________________________________________________________________")

    # If the interview is over, break the loop
    if bot_response.lower() == "goodbye!":
        break

    # Keep asking for valid JSON input until received
    while True:
        try:

            user_json = input("Your response: ").strip()
            user_response = json.loads(user_json)

            # Ensure the JSON contains the expected keys
            if "new_code_written" not in user_response or "user_input" not in user_response:
                raise ValueError("Invalid format: JSON must include 'new_code_written' and 'user_input'.")

            break  # Valid JSON received, exit loop

        except json.JSONDecodeError:
            print("❌ Invalid JSON format. Please try again.")
        except ValueError as e:
            print(f"❌ {e}. Please try again.")

    # add 1.5mins to the timer
    elapsed_time += user_input_time


    # Extract user response fields
    new_code_written = user_response["new_code_written"]
    user_input = user_response["user_input"]


    # Generate AI-powered summary of past responses
    past_summary = current_state["input"][-1]["summary_of_past_response"]
    ai_summary_prompt = f"""
        Given the following conversation history, generate a short and concise summary:

      ç  Conversation History:
        {past_summary}
        Bot's latest response: {bot_response}
        User's latest response: {user_input}

        Provide a **brief and structured** summary of what has happened so far in 2-3 sentences.
    """

    summary_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": "You are a helpful assistant that summarizes conversations."},
                  {"role": "user", "content": ai_summary_prompt}]
    )

    updated_summary = summary_response.choices[0].message.content.strip()
    # Construct the next input state
    next_input = {
        "interview_question": initial_state["input"][0]["interview_question"],  # Keep the original question
        "summary_of_past_response": updated_summary,  # AI-generated structured summary
        "new_code_written": new_code_written,
        "user_input": user_input
    }

    print("AI Summary:", updated_summary)
    print("________________________________________________________________________________________")

    # Update current state
    current_state = {
        "input": [next_input],  # Correct format for LangGraph
        "decision": [],
        "output": []
    }
