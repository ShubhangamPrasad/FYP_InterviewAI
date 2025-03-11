import os
from openai import AzureOpenAI

endpoint = "https://aiview-azureopenai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview"
key = "EGyCt6tCmsRzncdBPLYHV5Mqzxvb87e7DbloT6fVvtxVjYXDNz6IJQQJ99BAACHYHv6XJ3w3AAABACOGlGqe"

client = AzureOpenAI(
  azure_endpoint = endpoint, 
  api_key=key,  
  api_version="2024-02-01"
)

response = client.chat.completions.create(
    model="gpt-4o", # model = "deployment_name"
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Does Azure OpenAI support customer managed keys?"},
        {"role": "assistant", "content": "Yes, customer managed keys are supported by Azure OpenAI."},
        {"role": "user", "content": "Do other Azure AI services support this too?"}
    ]
)

print(response.choices[0].message.content)