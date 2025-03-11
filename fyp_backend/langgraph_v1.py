# Initialize Azure OpenAI client
endpoint = "https://aiview-azureopenai.openai.azure.com"
key = "EGyCt6tCmsRzncdBPLYHV5Mqzxvb87e7DbloT6fVvtxVjYXDNz6IJQQJ99BAACHYHv6XJ3w3AAABACOGlGqe"

import os
import operator
from openai import AzureOpenAI
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated, Dict, List

class State(TypedDict):
    input: Annotated[List[str], operator.add]  # Allows multiple inputs
    decision: Annotated[List[str], operator.add]  # Allows multiple decisions per execution step
    output: Annotated[List[str], operator.add]  # Stores only latest response

# Initialize StateGraph with the correct state schema
workflow = StateGraph(State)

# Initialize Azure OpenAI client
client = AzureOpenAI(
  azure_endpoint=endpoint, 
  api_key=key,  
  api_version="2024-02-01"
)

def node3(state: State) -> State:
    input_str = state["input"][-1]  # Take the latest input only
    prompt = fprompt = f"""
        You are an interviewer taking a SWE interview. You've just received a JSON input containing four things: 
        - Interview question
        - Summary of past response
        - New code written
        - User's input

        The input is: {input_str} 

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

    decision = response.choices[0].message.content.strip().lower()

    print("Decision is " + decision)
    # Append decision (needed for LangGraph state updates)
    state["decision"].append(decision)
    return state

def router(state: State) -> Dict:
    decision = state["decision"][-1]  # Take the latest decision
    
    if decision == "1":
        print("heading to node 4")
        return {"next": "node_4"}  # Return a state update with the next node
    elif decision == "2":
        print("heading to node 5")
        return {"next": "node_5"}  # Return a state update with the next node
    elif decision == "3":
        print("heading to node 6")
        return {"next": "node_6"}  # Return a state update with the next node
    else:
        print("heading to node 7")
        return {"next": "node_7"}  # Return a state update with the next node


def node4(state: State) -> State:
    print("im at node 4")
    input_str = state["input"][-1]  # Take latest input only
    prompt = f"This is the summary of what the user has done and said inthe interview thus far '{input_str}'.\
    The user is confused and needs some guidance. Provide the user with some guidance questions on how to proceed without giving them the answer. \
        Remember this is a conversation, so leave room for further discussion"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    state["output"] = [response.choices[0].message.content]  # Overwrite instead of appending multiple times
    return state

def node5(state: State) -> State:
    print("im at node 5")
    input_str = state["input"][-1]  # Take latest input only
    prompt = f"This is the summary of what the user has done and said in the interview thus far '{input_str}'.\
    The user has a specific quesiton they'd like answered, ask them a question that would be similar to what an interviewer \
    might ask without giving them any new info.\
    Remember this is a conversation, so leave room for further discussion"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    state["output"] = [response.choices[0].message.content]  # Overwrite instead of appending multiple times
    return state

def node6(state: State) -> State:
    print("im at node 6")
    input_str = state["input"][-1]  # Take latest input only
    prompt = f"This is the summary of what the user has done and said in the interview thus far '{input_str}'.\
    The user has given a response, at this point i need you to evaluate if the response is an accurate one. \
        If it's okay and interviewer has approx 10mins left, throw them a harder version of the same question by changing some paramters to see how they'd respond. \
            If you've already done that then provide them with some feedback on what they've done well and end the interview"
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    state["output"] = [response.choices[0].message.content]  # Overwrite instead of appending multiple times
    return state

# write node 7 which basically returns a "goodbye" message no need for GenAI
def node7(state: State) -> State:
    print("im at node 7")
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
workflow.add_edge("node_3", "router")  # Decision-making step

workflow.add_conditional_edges(
    "router",
    lambda state: state["next"],  # Use the "next" key from the state to determine the next node
    {
        "node_4": "node_4",
        "node_5": "node_5",
        "node_6": "node_6",
        "node_7": "node_7"
    }
)

# Set the entry point
workflow.set_entry_point("node_3")

# Set the termination points
workflow.set_finish_point("node_4")
workflow.set_finish_point("node_5")
workflow.set_finish_point("node_6")
workflow.set_finish_point("node_7")

# Compile the workflow
app = workflow.compile()

initial_state = {
    "input": [
        {
            "interview_question": "Write a function that sorts an array of numbers in ascending order using any sorting algorithm of your choice.",
            "summary_of_past_response": "The user has just started and has not written any code yet.",
            "new_code_written": "",
            "user_input": "I'm not sure which sorting algorithm to use. Should I go with bubble sort or quicksort?"
        }
    ],
    "decision": [],
    "output": []
}


# Invoke workflow and check for issues
result_state = app.invoke(initial_state)

print("Final Output:", result_state["output"])
print("________________________________________________________________________________________")
