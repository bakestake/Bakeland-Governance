# Wormhole Hackathon Submission
  ![image](https://github.com/user-attachments/assets/d9cd7a7c-e54c-40b3-ac68-0ed22613ee4a)

# Bakeland Multi-GOV
  <p align="center" width="100%">
    <img src="https://github.com/user-attachments/assets/9c172c13-c41f-4a81-8566-55e07a8ea359" width=200 height=200 align=center>
  </p>


Wormhole usage & Features
1. Proposal creation on single hub chain
2. Vote casting on multiple chains
3. No double voting on multiple chains - voting status validation through queries
4. execution on single hub chain - vote count aggregation through queries

Future considerations
1. Making use of fractional vote weight according to global veBuds balance of use
    - Global veBuds balance will be considered. and propotional vote weight will be given to user
    - This will promote users to keep veBuds on single chain and make use of total balance on single chain to provide higher weight to their vote
    - This will leave no chance of double voting or even if user votes on multiple chains
    - So if a user wants to excercise his/her full vote power user will either keep whole balance on preferred chain and vote on single chain with full weighh or user will have to vote on all chains 
    where he/she holds veBuds balance
    - To enable this, We can use wormhole queries to validate user's global veBuds balance distribution. 