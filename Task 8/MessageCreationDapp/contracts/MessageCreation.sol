pragma solidity >=0.8.0;

contract MessageCreation {
  string private message;

  constructor() payable {
    message = "test for now";
  }

  function retrieveMessage() public view returns(string memory) {
    return message;
  }

  function placeMessage(string memory newMessage) public {
    message = newMessage;
  }
}