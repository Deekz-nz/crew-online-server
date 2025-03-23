/*
  GENERATED BY CHAT-GPT
*/
// File: src/rooms/CrewRoom.ts
import { Room, Client } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { CrewGameState } from "./schema/CrewRoomState";
import { Card, CardColor, CommunicationRank, GameStage, Player, SimpleTask, Trick } from "./schema/CrewTypes";


interface JoinOptions {
  displayName: string;
}

interface GameSetupInstructions {
  includeTasks: boolean;
  taskInstructions: {
    plainTasks: number;
    orderedTasks: number;
    sequencedTasks: number;
    lastTask: boolean;
  }
}
export class CrewRoom extends Room<CrewGameState> {
  private lastActivityTimestamp: number;
  private inactivityInterval: NodeJS.Timeout;
  maxClients = 5;

  onCreate(options: any) {
    this.state = new CrewGameState();

    // Set interval to check for inactivity
    const TIMEOUT_MINUTES = 10;
    const TIMEOUT_DURATION = TIMEOUT_MINUTES * 60 * 1000; // 10 minutes
    this.inactivityInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastActivityTimestamp > TIMEOUT_DURATION) {
        console.log("Room inactive for 10 minutes. Disposing...");

        // Notify clients BEFORE disconnecting
        // TODO: Implement frontend handling of this message
        this.broadcast("room_closed", { reason: "inactivity_timeout" });

        setTimeout(() => {  
            this.disconnect();
        }, 1000); // delay to allow message delivery 
      }
    }, 60 * 1000); // Check every minute

    // GameStage = NotStarted
    this.onMessage("start_game", (client, gameSetupInstructions: GameSetupInstructions) => {
      const player = this.state.players.get(client.sessionId);
      
      // Check current game stage is "not started"
      if (this.state.currentGameStage != GameStage.NotStarted) return;

      // Check there is at least 3 players registered
      if (this.state.players.size <= 2) return;

      // Check if player is host
      if (!player?.isHost) return;

      // Update inactive timer
      this.updateActivity();

      // Start the game
      this.startGame(gameSetupInstructions);

    })

    // GameStage = GameSetup
    this.onMessage("take_task", (client, taskData: SimpleTask) => {
      if (this.state.currentGameStage !== GameStage.GameSetup) return;
    
      const task = this.state.allTasks.find(t => this.isSameTask(t, taskData)); // find matching task
      if (!task) return;
    
      // Task already taken
      if (task.player !== "") return;
      
      // Update inactive timer
      this.updateActivity();
    
      // Assign task to player
      task.player = client.sessionId;
    });
    

    // GameStage = GameSetup
    this.onMessage("return_task", (client, taskData: SimpleTask) => {
      if (this.state.currentGameStage !== GameStage.GameSetup) return;
    
      const task = this.state.allTasks.find(t => this.isSameTask(t, taskData)); // find matching task
      if (!task) return;
    
      // Can only return your own task
      if (task.player !== client.sessionId) return;
    
      // Update inactive timer
      this.updateActivity();

      // Return task
      task.player = "";
    });
    

    // GameStage = GameSetup
    this.onMessage("finish_task_allocation", (client) => {
      this.updateActivity();
      if (this.state.currentGameStage !== GameStage.GameSetup) return;
    
      const unassignedTasks = this.state.allTasks.filter(task => task.player === "");
      if (unassignedTasks.length > 0) return; // Not all tasks taken
    
      // Update inactive timer
      this.updateActivity();

      const newTrick = new Trick();
      this.state.currentTrick = newTrick;
      this.state.currentGameStage = GameStage.TrickStart;
    });
    

    // GameStage = TrickStart or TrickMiddle
    this.onMessage("play_card", (client, cardData: { color: CardColor; number: number }) => {
      this.updateActivity();
      const player = this.state.players.get(client.sessionId);
      // Check GameStage
      if (this.state.currentGameStage !== GameStage.TrickStart && this.state.currentGameStage !== GameStage.TrickMiddle) return;

      // Check that it is actually this person's turn
      if (!player || this.state.currentPlayer !== client.sessionId) return;

      // Find and remove the card from player's hand
      const cardIndex = player.hand.findIndex(
        (card) => card.color === cardData.color && card.number === cardData.number
      );
      if (cardIndex === -1) return; // Card not found

      // Remove card from player's hand
      const [playedCard] = player.hand.splice(cardIndex, 1);

      // Check if this card was communicated — track whether we cleared it in case we revert
      let communicationCleared = false;
      if (
        player.hasCommunicated &&
        player.communicationCard &&
        player.communicationCard.color === playedCard.color &&
        player.communicationCard.number === playedCard.number
      ) {
        player.communicationCard = null; // Reset to null
        player.communicationRank = CommunicationRank.Unknown;
        communicationCleared = true;
      }

      const trick = this.state.currentTrick;
      
      // Update inactive timer
      this.updateActivity();

      if (this.state.currentGameStage === GameStage.TrickStart) {
        // === First card of the trick ===  
        // Update state
        const newTrick = new Trick();
        newTrick.playedCards.push(playedCard);
        newTrick.playerOrder.push(client.sessionId);
        newTrick.trickCompleted = false;
        this.state.currentTrick = newTrick;
    
        // Advance game stage to TrickMiddle
        this.state.currentGameStage = GameStage.TrickMiddle;
        this.state.currentPlayer = this.getNextPlayer(client.sessionId);
      } else if (this.state.currentGameStage === GameStage.TrickMiddle) {
        // It's NOT the first card, so we have to make sure the player isn't re-negging
        // i.e. if the first card in the trick was a blue, and the player is NOT playing a blue, then check to make sure they have no blues
        const leadCard = trick.playedCards[0];

        if (playedCard.color !== leadCard.color) {
          const hasLeadColor = player.hand.some((card) => card.color === leadCard.color);
          if (hasLeadColor) {
            // Player is re-negging — revert card removal and ignore play
            player.hand.push(playedCard); // Add card back to hand
            if (communicationCleared) { // Restore communication
              player.hasCommunicated = true;
              player.communicationCard = playedCard;
            }
            return;
          }
        }
        // Add played card to trick
        trick.playedCards.push(playedCard);
        trick.playerOrder.push(client.sessionId);

        // Now check - is trick finished?
        if (trick.playedCards.length === this.state.playerOrder.length) {
          const winnerId = this.determineTrickWinner(trick);
          trick.trickWinner = winnerId;
          trick.trickCompleted = true;
          this.state.currentPlayer = winnerId;
          this.state.currentGameStage = GameStage.TrickEnd;
          this.state.completedTricks.push(trick);
          // Evaluate this trick for tasks
          this.evaluateTrickForTasks(trick);
        } else {
          // Trick still going - move to next player
          this.state.currentPlayer = this.getNextPlayer(client.sessionId);
        }
      } else {
        // Invalid game stage - put card back
        player.hand.push(playedCard); // Add card back to hand
        if (communicationCleared) { // Restore communication
          player.hasCommunicated = true;
          player.communicationCard = playedCard;
        }
        return;
      }

    });

    // GameStage = TrickEnd
    this.onMessage("finish_trick", (client) => {
      const player = this.state.players.get(client.sessionId);
      
      // Check current game stage is "TrickEnd"
      if (this.state.currentGameStage != GameStage.TrickEnd) return;

      // Check that it is actually this person's turn
      if (!player || this.state.currentPlayer !== client.sessionId) return;

      // Update inactive timer
      this.updateActivity();
      
      const tricksPlayed = this.state.completedTricks.length;

      if (tricksPlayed >= this.state.expectedTrickCount) {
        // All tricks played: count how many each player won
        const trickWins = new Map<string, number>(); // sessionId -> win count
    
        for (const trick of this.state.completedTricks) {
          const winnerId = trick.trickWinner;
          if (winnerId) {
            trickWins.set(winnerId, (trickWins.get(winnerId) || 0) + 1);
          }
        }
        this.state.currentGameStage = GameStage.GameEnd;
        this.state.currentTrick = new Trick();
        this.state.gameFinished = true;
        
        // Check task success
        const allTasksCompleted = this.state.allTasks.every(task => task.completed);
        const noTasksFailed = this.state.allTasks.every(task => !task.failed);
        
        // Set success flag
        this.state.gameSucceeded = allTasksCompleted && noTasksFailed;
        
        console.log("Game finished. Success:", this.state.gameSucceeded);
    
      } else {
        // More tricks to play: reset for next trick
        this.state.currentTrick = new Trick();
        this.state.currentGameStage = GameStage.TrickStart;
        // currentPlayer remains unchanged (winner of last trick leads next)
      }
    });

    //GameStage = TrickEnd or TrickStart
    this.onMessage("communicate", (client, details: { card: Card; cardRank: CommunicationRank }) => {
      const player = this.state.players.get(client.sessionId);
    
      // Validate game stage
      if (this.state.currentGameStage !== GameStage.TrickStart && this.state.currentGameStage !== GameStage.TrickEnd) return;
    
      // Check if player already communicated
      if (player.hasCommunicated) return;
    
      // Validate communication
      if (!this.isValidCommunication(player, details.card, details.cardRank)) return;
    
      // Update inactive timer
      this.updateActivity();

      // Convert plain object to Card schema
      const schemaCard = new Card();
      schemaCard.color = details.card.color;
      schemaCard.number = details.card.number;
    
      // Assign schema instance
      player.hasCommunicated = true;
      player.communicationCard = schemaCard;
      player.communicationRank = details.cardRank;
    });

    this.onMessage("restart_game", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !player.isHost) return; // Only host can restart
    
      console.log(`Game is being restarted by ${player.displayName}`);
      this.resetGameState();
    });
    

  }

  // Helper method for inactivity
  updateActivity() {
    this.lastActivityTimestamp = Date.now();
  }

  onAuth(client: Client, options: any, request: any) {
    const token = options.token;  // Get token from client
    const expectedSecret = process.env.SHARED_SECRET;
  
    if (token !== expectedSecret) {
      throw new Error("Unauthorized");
    }
  
    return true;
  }

  onJoin(client: Client, options: JoinOptions) {
    // TODO: If game has started, don't let anyone join
    const player = new Player();
    player.sessionId = client.sessionId;

    // Get current player count for a fallback display name
    const playerCount = this.state.players.size + 1;
    player.displayName = options.displayName || "Player " + playerCount.toString();

    if (this.state.players.size === 0) {
      player.isHost = true;
    }
    this.state.players.set(client.sessionId, player);
    this.state.playerOrder.push(client.sessionId);
    
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    const wasHost = player?.isHost;
  
    // Remove player from players map
    this.state.players.delete(client.sessionId);
  
    // Remove from playerOrder array
    const index = this.state.playerOrder.indexOf(client.sessionId);
    if (index !== -1) this.state.playerOrder.splice(index, 1);
  
    // Reassign host if necessary
    if (wasHost && this.state.players.size > 0) {
      const firstKey = this.state.players.keys().next().value;
      const newHost = this.state.players.get(firstKey);
      if (newHost) {
        newHost.isHost = true;
      }
    }
  }

  onDispose() {
    clearInterval(this.inactivityInterval);
    console.log("Room disposed");
  }

  startGame(gameSetupInstructions: GameSetupInstructions) {
    this.state.currentGameStage = GameStage.GameSetup;
    this.state.gameStarted = true;

    // Create and shuffle the deck
    const deck = this.generateDeck();
    this.shuffle(deck);

    // Deal cards evenly
    const playerIds = Array.from(this.state.players.keys());
  
    // Randomize starting index
    const startIndex = Math.floor(Math.random() * playerIds.length);

    // Set expected trick count
    this.state.expectedTrickCount = this.getExpectedTrickCount();

    // Deal cards starting from random player
    let dealIndex = startIndex;
    while (deck.length) {
      const playerId = playerIds[dealIndex % playerIds.length];
      this.state.players.get(playerId)!.hand.push(deck.pop()!);
      dealIndex++;
    }

    // Determine who has black 4
    const starterId = playerIds.find(id =>
      this.state.players.get(id)!.hand.some(card => card.color === CardColor.Black && card.number === 4)
    );

    if (starterId) {
      this.state.currentPlayer = starterId;
      this.state.commanderPlayer = starterId;
    } else {
      console.log("Uh oh, can't find the Black 4 in anyone's hand??!");
    }

    if (gameSetupInstructions.includeTasks) {
      const generatedTasks = this.generateTasks(gameSetupInstructions.taskInstructions);
      this.state.allTasks.push(...generatedTasks);
    }
    
    // this.state.currentGameStage = GameStage.TrickStart;
  }

  generateDeck(includeBlackCards: boolean = true): Card[] {
    const colors = [CardColor.Yellow, CardColor.Green, CardColor.Pink, CardColor.Blue];
    const deck: Card[] = [];
  
    for (const color of colors) {
      for (let num = 1; num <= 9; num++) {
        const card = new Card();
        card.color = color;
        card.number = num;
        deck.push(card);
      }
    }
  
    if (includeBlackCards) {
      for (let num = 1; num <= 4; num++) {
        const card = new Card();
        card.color = CardColor.Black;
        card.number = num;
        deck.push(card);
      }
    }
  
    return deck;
  }

  getExpectedTrickCount(): number {
    // Total players = total tricks usually (or your custom logic)
    
    // Determine how many tricks are expected based on number of players
    const numPlayers = this.state.playerOrder.length;
    let totalTricksExpected = 0;

    switch (numPlayers) {
      case 5: totalTricksExpected = 8; break;
      case 4: totalTricksExpected = 10; break;
      case 3: totalTricksExpected = 13; break;
      default: return; // Invalid player count
    }
    return totalTricksExpected;
  }
  
  generateTasks(instructions: GameSetupInstructions["taskInstructions"]): SimpleTask[] {
    const cardPool = this.generateDeck(false); // No black cards
    this.shuffle(cardPool);
    const taskList: SimpleTask[] = [];
  
    const drawCard = (): Card | null => cardPool.pop() ?? null;
  
    // === Plain Tasks ===
    for (let i = 0; i < instructions.plainTasks; i++) {
      const card = drawCard();
      if (!card) break;
      const task = new SimpleTask();
      task.card = card;
      task.player = "";
      task.taskCategory = "plain";
      task.sequenceIndex = 0;
      taskList.push(task);
    }
  
    // === Ordered Tasks ===
    for (let i = 1; i <= instructions.orderedTasks; i++) {
      const card = drawCard();
      if (!card) break;
      const task = new SimpleTask();
      task.card = card;
      task.player = "";
      task.taskCategory = "ordered";
      task.sequenceIndex = i; // Starts at 1
      taskList.push(task);
    }
  
    // === Sequenced Tasks ===
    for (let i = 1; i <= instructions.sequencedTasks; i++) {
      const card = drawCard();
      if (!card) break;
      const task = new SimpleTask();
      task.card = card;
      task.player = "";
      task.taskCategory = "sequence";
      task.sequenceIndex = i; // Starts at 1
      taskList.push(task);
    }
  
    // === Must Be Last Task ===
    if (instructions.lastTask) {
      const card = drawCard();
      if (card) {
        const task = new SimpleTask();
        task.card = card;
        task.player = "";
        task.taskCategory = "must_be_last";
        task.sequenceIndex = 0;
        taskList.push(task);
      }
    }
  
    return taskList;
  }
  

  isSameTask(a: SimpleTask, b: SimpleTask): boolean {
    return (
      a.card.color === b.card.color &&
      a.card.number === b.card.number &&
      a.taskCategory === b.taskCategory &&
      a.sequenceIndex === b.sequenceIndex
    );
  }
  
  
  shuffle(array: Card[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getNextPlayer(currentPlayer: string) {
    const currentIndex = this.state.playerOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % this.state.playerOrder.length;
    return this.state.playerOrder[nextIndex];
  }

  determineTrickWinner(trick: Trick) {
    const playedCards = trick.playedCards;
    const playerOrder = trick.playerOrder;
  
    let winningIndex = 0;
    let highestValue = -1;
  
    // First, check for any black cards
    let blackCardPlayed = false;
  
    playedCards.forEach((card, idx) => {
      if (card.color === CardColor.Black) {
        blackCardPlayed = true;
        if (card.number > highestValue) {
          highestValue = card.number;
          winningIndex = idx;
        }
      }
    });
  
    if (!blackCardPlayed) {
      // No black cards, determine winner by lead suit
      const leadColor = playedCards[0].color;
      highestValue = -1;
  
      playedCards.forEach((card, idx) => {
        if (card.color === leadColor && card.number > highestValue) {
          highestValue = card.number;
          winningIndex = idx;
        }
      });
    }
  
    return playerOrder[winningIndex]; // Return the sessionId of the winning player
  }

  // Check the communication rank, and whether this is a valid communicate (also check they have the card they're trying to communicate)
  // - Highest iff they have more than one of that colour and this is the highest number
  // - Lowest iff they have more than one of that colour and this is the lowest number
  // - Only iff they have only one of that colour
  // - Unknown is allowed iff exactly one of the above is true
  isValidCommunication(
    player: Player,
    card: Card,
    rank: CommunicationRank
  ): boolean {
    // Check card isn't black
    if (card.color === "black") return false;

    // Find all cards in player's hand of the same color
    const sameColorCards = player.hand.filter((c) => c.color === card.color);
  
    if (sameColorCards.length === 0) return false; // Player doesn't have any card of that color
    const numbers = sameColorCards.map((c) => c.number);
    const maxNumber = Math.max(...numbers);
    const minNumber = Math.min(...numbers);
  
    // Confirm player actually has the communicated card
    const hasCard = sameColorCards.some(
      (c) => c.number === card.number
    );
    if (!hasCard) return false;
  
    switch (rank) {
      case CommunicationRank.Only:
        return sameColorCards.length === 1;
  
      case CommunicationRank.Highest:
        return sameColorCards.length > 1 && card.number === maxNumber;
  
      case CommunicationRank.Lowest:
        return sameColorCards.length > 1 && card.number === minNumber;
  
      case CommunicationRank.Unknown:
        const isHighest = card.number === maxNumber && sameColorCards.length > 1;
        const isLowest = card.number === minNumber && sameColorCards.length > 1;
        const isOnly = sameColorCards.length === 1;
        const validRanks = [isHighest, isLowest, isOnly].filter((v) => v);
        return validRanks.length === 1; // Exactly one condition is true
  
      default:
        return false;
    }
  }

  evaluateTrickForTasks(trick: Trick) {
    const trickIndex = this.state.completedTricks.length - 1;
  
    // === Ordered Tasks Evaluation ===
    const orderedTasks = this.state.allTasks
      .filter(task => !task.completed && !task.failed && task.taskCategory === "ordered")
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  
    for (const task of orderedTasks) {
      const cardInTrick = trick.playedCards.some(card =>
        card.color === task.card.color && card.number === task.card.number
      );
  
      if (!cardInTrick) continue; // Not in this trick, skip evaluation
  
      if (trick.trickWinner !== task.player) {
        task.failed = true; // Card played, but wrong player won
        continue;
      }
  
      // Check if task is completed in correct order
      if (task.sequenceIndex - 1 === this.state.completedTaskCount) {
        task.completed = true;
        task.completedAtTrickIndex = trickIndex;
        this.state.completedTaskCount += 1;
      } else {
        task.failed = true; // Completed out of order
      }
    }
  
    // === Sequence Tasks Evaluation ===
    const sequenceTasks = this.state.allTasks
      .filter(task => !task.completed && !task.failed && task.taskCategory === "sequence")
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  
    for (const task of sequenceTasks) {
      const cardInTrick = trick.playedCards.some(card =>
        card.color === task.card.color && card.number === task.card.number
      );
  
      if (!cardInTrick) continue;
  
      if (trick.trickWinner !== task.player) {
        task.failed = true;
        continue;
      }
  
      if (task.sequenceIndex - 1 === this.state.completedSequenceTaskCount) {
        task.completed = true;
        task.completedAtTrickIndex = trickIndex;
        this.state.completedSequenceTaskCount += 1;
        this.state.completedTaskCount += 1; // Count towards total as well
      } else {
        task.failed = true;
      }
    }
  
    // === Plain Tasks Evaluation ===
    const plainTasks = this.state.allTasks
      .filter(task => !task.completed && !task.failed && task.taskCategory === "plain");
  
    for (const task of plainTasks) {
      const cardInTrick = trick.playedCards.some(card =>
        card.color === task.card.color && card.number === task.card.number
      );
  
      if (!cardInTrick) continue;
  
      if (trick.trickWinner === task.player) {
        task.completed = true;
        task.completedAtTrickIndex = trickIndex;
        this.state.completedTaskCount += 1;
      } else {
        task.failed = true;
      }
    }
  
    // === Must Be Last Task Evaluation ===
    const lastTrickIndex = this.state.completedTricks.length - 1;
    const isLastTrick = this.state.completedTricks.length === this.state.expectedTrickCount;
  
    const lastTasks = this.state.allTasks
      .filter(task => !task.completed && !task.failed && task.taskCategory === "must_be_last");
  
    for (const task of lastTasks) {
      const cardInTrick = trick.playedCards.some(card =>
        card.color === task.card.color && card.number === task.card.number
      );
  
      if (!cardInTrick) continue;
  
      if (trick.trickWinner !== task.player) {
        task.failed = true;
        continue;
      }
  
      if (isLastTrick) {
        task.completed = true;
        task.completedAtTrickIndex = trickIndex;
        this.state.completedTaskCount += 1;
      } else {
        task.failed = true;
      }
    }
  
    // === Final Check for Remaining Ordered Tasks ===
    for (const task of orderedTasks) {
      if (!task.completed && !task.failed && task.sequenceIndex <= this.state.completedTaskCount) {
        task.failed = true; // Missed its proper order slot
      }
    }
  }

  resetGameState() {
    this.state.gameStarted = false;
  
    // Reset player state but keep displayName, sessionId, isHost
    this.state.players.forEach((player) => {
      player.hand = new ArraySchema<Card>();
      player.hasCommunicated = false;
      player.communicationCard = null;
      player.communicationRank = CommunicationRank.Unknown;
    });
  
    this.state.currentPlayer = "";
    this.state.commanderPlayer = "";
    this.state.currentTrick = new Trick();
    this.state.completedTricks = new ArraySchema<Trick>();
    this.state.allTasks = new ArraySchema<SimpleTask>();
    this.state.completedTaskCount = 0;
    this.state.completedSequenceTaskCount = 0;
    this.state.gameFinished = false;
    this.state.gameSucceeded = false;
    this.state.currentGameStage = GameStage.NotStarted;
  }
  
  
}
