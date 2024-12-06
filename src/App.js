import React, { useState, useRef } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  MessageSeparator,
  Avatar,
  ConversationHeader,
  InfoButton,
  TypingIndicator,
  Conversation,
  Sidebar,
  Search,
  ConversationList,
  EllipsisButton,
} from '@chatscope/chat-ui-kit-react';
import styles from '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { messagesData, conversations } from './TestData';
import LoginPage from './pages/login';
import './App.css';

function App() {
  const [username, setUsername] = useState(null);
  const [userPicture, setUserPicture] = useState(null);
  const [password, setPassword] = useState(null);
  const [wsserver, setWsserver] = useState(null);
  const [friends, setFriends] = useState(null);
  const [friendsPicture, setFriendsPicture] = useState(null);
  // track the msg history for current dialogue
  const [msgHistory, setMsgHistory] = useState([]);
  // track the current friend in dialogue window
  const [selectedFriend, setSelectedFriend] = useState(null);
  const selectedFriendRef = useRef(null);
  // track the current friends' unread statuses
  const [unreadCount, setUnreadCount] = useState({});

  const handleMsgSend = (msg) => {
    const msg_to_send = {
      sender: username,
      receiver: selectedFriend,
      message_type: 'direct',
      content: msg,
    };

    if (wsserver && wsserver.readyState === WebSocket.OPEN) {
      wsserver.send(JSON.stringify(msg_to_send));

      // Update local state for the outgoing message
      setMsgHistory((prevMessages) => [
        ...prevMessages,
        {
          direction: 'outgoing',
          message: msg,
          sender: username,
          position: 'single',
        },
      ]);
    }
  };

  const handleLoginSuccess = (
    user,
    user_picture,
    ws,
    friends,
    friendsPicture
  ) => {
    setUsername(user);
    setUserPicture(user_picture);
    setPassword(password);
    setWsserver(ws);
    setFriends(friends);
    setFriendsPicture(friendsPicture);

    const current_unread_counts = friends.reduce((acc, curr) => {
      acc[curr] = 0; // Set each element as a key with a value of 0
      return acc;
    }, {});
    setUnreadCount(current_unread_counts);
    console.log(current_unread_counts);

    ws.onmessage = (event) => {
      const parsed_data = JSON.parse(event.data);
      console.log('received msg', parsed_data);
      console.log('sender', parsed_data.sender);
      console.log('selectedFriend', selectedFriendRef.current);

      // Update local state for the outgoing message
      if (parsed_data.sender === selectedFriendRef.current) {
        setMsgHistory((prevMessages) => [
          ...prevMessages,
          {
            direction: 'incoming',
            message: parsed_data.content,
            sender: parsed_data.sender,
            position: 'single',
          },
        ]);
      } else {
        console.log('receive msg for non-current window');
        setUnreadCount((prevCounts) => ({
          ...prevCounts,
          [parsed_data.sender]: (prevCounts[parsed_data.sender] || 0) + 1,
        }));
      }
    };
  };

  const handleMsgHistoryPull = async (username, selectedFriend) => {
    const response = await fetch(
      `/chat-history?username_a=${username}&username_b=${selectedFriend}`
    );
    console.log('response received');
    if (response.status !== 200) {
      //setError('Failed to fetch friends');
      return;
    }
    const msgs = await response.json();
    console.log(msgs);
    const arrangedMsgs = await msgs.messages.map((rawMessage) => ({
      direction: rawMessage.receiver === username ? 'incoming' : 'outgoing',
      message: rawMessage.message,
      position: 'single', // This can be adjusted depending on the message order
      sender: rawMessage.sender === username ? 'You' : rawMessage.sender,
    }));
    setMsgHistory(arrangedMsgs);
  };

  const handleConversationClick = (friendname) => {
    console.log(`switching to conversation ${friendname}`);
    setSelectedFriend(friendname);
    selectedFriendRef.current = friendname;
    handleMsgHistoryPull(username, friendname);
    setUnreadCount((prevCounts) => ({
      ...prevCounts,
      [friendname]: 0,
    }));
  };

  if (!username) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <MainContainer
      responsive
      style={{
        height: '600px',
      }}
    >
      {/* Left Hand Side */}

      <Sidebar position="left" scrollable>
        {/* <Search placeholder="Search..." /> */}
        <ConversationHeader style={{ backgroundColor: '#fff' }}>
          <Avatar src={userPicture} />
          <ConversationHeader.Content>{username}</ConversationHeader.Content>
        </ConversationHeader>
        <ConversationList>
          <ConversationList>
            {friends.map((friend, index) => (
              <Conversation
                //key={1}
                name={friend}
                unreadCnt={unreadCount[friend] || 0}
                onClick={() => handleConversationClick(friend)}
              >
                <Avatar
                  src={friendsPicture[index]}
                  name={friend}
                  status="available"
                />
              </Conversation>
            ))}
          </ConversationList>
        </ConversationList>
      </Sidebar>

      {/* Right Hand Side */}

      {selectedFriend ? (
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back />
            <ConversationHeader.Content userName={selectedFriend} />
            <ConversationHeader.Actions>
              <EllipsisButton orientation="vertical" />
            </ConversationHeader.Actions>
          </ConversationHeader>
          <MessageList>
            {msgHistory.map((msg, index) => (
              <Message key={index} model={msg} />
            ))}
          </MessageList>
          <MessageInput
            placeholder="Type a message here"
            onSend={handleMsgSend}
          />
        </ChatContainer>
      ) : (
        <div style={{ padding: '20px' }}>
          Select a conversation to start chatting.
        </div>
      )}
    </MainContainer>
  );
}

export default App;
