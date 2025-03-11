# Multiplayer Game Server using Node.js and Socket.IO

This is a real-time multiplayer game server built using Node.js and Socket.IO. It provides functionalities for player connections, movement, shooting, health management, and room creation for multiplayer sessions.

## Features
- **Player Connection & Disconnection**
- **Room Management** (Create, Join, Leave Rooms)
- **Player Movement & Rotation Synchronization**
- **Shooting Mechanism**
- **Health System**
- **Real-time Communication via WebSockets**

## Installation
### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/Ad-mob-dev/nodeGameServer.git
   cd nodeGameServer
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
   This will install the required packages listed in `package.json`, including:
   - `express` - For handling HTTP requests
   - `socket.io` - For real-time WebSocket communication
   - `cors` - To handle Cross-Origin Resource Sharing

3. Start the server:
   ```sh
   npm run server
   ```

## API Endpoints
- `GET /` - Returns a simple message confirming the server is running.

## Socket.IO Events
### Connection Events
- **`player connect`** - Registers a new player on connection.
- **`disconnect`** - Removes the player from the game on disconnection.

### Room Management
- **`create room`** - Allows a player to create a new room.
- **`join room`** - Lets a player join an existing room.
- **`leave room`** - Removes a player from a room and deletes the room if empty.

### Gameplay Events
- **`play`** - Handles spawning a player at a random spawn point.
- **`player move`** - Updates the player's position.
- **`player turn`** - Updates the player's rotation.
- **`player shoot`** - Broadcasts shooting actions to other players.
- **`health`** - Manages player and enemy health.

## Configuration
- You can modify the server port in `server.listen(3000, ...)` if needed.

## License
This project is licensed under the MIT License.

## Contributing
Feel free to fork this project and submit pull requests!

## Author
[Adeel Khan]

