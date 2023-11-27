(function ($) {
	$(document).ready(function () {
		//Special characters
		var HEART = 0;
		var DIAMOND = 1;
		var SPADE = 2;
		var CLUB = 3;
		var BACK1 = 4;
		var BACK2 = 5;
		var TEN = 7;
		//Modes
		var MODE_NOINPUT = 0;
		var MODE_GETBET = 1;
		var MODE_HITORSTAND = 2;
		var MODE_STARTOVER = 3;
		//Buttons
		var NONE = 0;
		var HIT = 1;
		var STAND = 2;
		var LESS = 4;
		var MORE = 8;
		// Bank and bets
		var BANK_INIT = 10000;
		var BANK_MAX = 100000;
		var BET_MIN = 500;
		var BET_MAX = 5000;
		var BET_INC = 500;
		//deal Mode
		var DEALER_FIRST = 0;
		var PLAYER_FIRST = 1;
		var DEALER_SECOND = 2;
		var PLAYER_SECOND = 3;
		var PLAYER_NEXT = 4;
		var DEALER_NEXT = 5;
		//Others
		var TOTAL_CARDS = 52;
		//objects
		var lcd = null;
		var lastKeyPressed = 0;
		var startSequenceTimeout = 0;
		var bank = BANK_INIT;
		var bet = BET_MIN;
		var deck = new Array(TOTAL_CARDS);
		var deckIndex = 0;
		var deckCard = 0;
		var playerHand = new Array(5);
		var playerIndex = 0;
		var dealerHand = new Array(5);
		var dealerIndex = 0;
		var dealerHoldCard = 0;
		var mode = MODE_NOINPUT;

		//Create special symbols and hook event handler to button
		initialse = function () {
			//function to allow binary notation in javascript
			function B(i) { if (typeof i == 'string') return parseInt(i, 2); throw "Expects string"; };
			//Initialise LCD display
			lcd = $(".LCD1602").lcd().data("lcd");
			//Initialise Buttons
			$(".keyboard button").click(function () {
				lastKeyPressed = parseInt($(this).val());
				switch (mode) {
					case MODE_GETBET: processGetBet(); break;
					case MODE_HITORSTAND: processHitStand(); break;
					case MODE_STARTOVER: startGame(); break;
				}
			});
			//Define extra characters
			var heart = [
				B("01010"),
				B("11111"),
				B("11111"),
				B("11111"),
				B("01110"),
				B("00100"),
				B("00000"),
				B("00000")
			];
			var diamond = [
				B("00100"),
				B("01110"),
				B("11111"),
				B("11111"),
				B("01110"),
				B("00100"),
				B("00000"),
				B("00000")
			];
			var spade = [
				B("00100"),
				B("01110"),
				B("11111"),
				B("11111"),
				B("00100"),
				B("01110"),
				B("00000"),
				B("00000")
			];
			var club = [
				B("01110"),
				B("01110"),
				B("11111"),
				B("11111"),
				B("00100"),
				B("01110"),
				B("00000"),
				B("00000")
			];
			var back1 = [
				B("11111"),
				B("10110"),
				B("10101"),
				B("10110"),
				B("10101"),
				B("10110"),
				B("10000"),
				B("11111")
			];
			var back2 = [
				B("11111"),
				B("00001"),
				B("01111"),
				B("00101"),
				B("00101"),
				B("10101"),
				B("01001"),
				B("11111")
			];
			var ten = [
				B("01000"),
				B("11000"),
				B("01000"),
				B("01010"),
				B("11101"),
				B("00101"),
				B("00101"),
				B("00010")
			];

			// Init card characters.
			lcd.createChar(HEART, heart);
			lcd.createChar(DIAMOND, diamond);
			lcd.createChar(SPADE, spade);
			lcd.createChar(CLUB, club);
			lcd.createChar(BACK1, back1);
			lcd.createChar(BACK2, back2);
			lcd.createChar(TEN, ten);
		};

		//Show opening splash screen. There are 6 animations in total
		startSequence = function () {
			lcd.clear();
			lcd.setCursor(0, 0);
			lcd.print("** Blackjack **");
			lcd.setCursor(5, 1);
			lcd.write(BACK1);
			lcd.write(BACK2);
			setTimeout(startSequence2, 1000);
		};

		startSequence2 = function () {
			lcd.setCursor(9, 1);
			lcd.write(BACK1);
			lcd.write(BACK2);
			setTimeout(startSequence3, 1000);
		};

		startSequence3 = function () {
			lcd.setCursor(5, 1);
			lcd.print("J");
			lcd.write(DIAMOND);
			setTimeout(startSequence4, 1000);
		};

		startSequence4 = function () {
			lcd.setCursor(9, 1);
			lcd.print("A");
			lcd.write(SPADE);
			setTimeout(startSequence5, 1000);
		};

		startSequence5 = function () {
			lcd.setCursor(0, 0);
			lcd.print("   Blackjack!   ");
			startSequenceTimeout = 14;
			setTimeout(startSequence6, 0);
		};

		startSequence6 = function () {
			startSequenceTimeout = startSequenceTimeout + 1;
			if ((startSequenceTimeout % 2) > 0)
				lcd.display();
			else
				lcd.noDisplay();
			if (startSequenceTimeout == 31)
				setTimeout(startGame, 1000);
			else
				setTimeout(startSequence6, (31 - startSequenceTimeout) * (31 - startSequenceTimeout));
		};

		//Game starts here
		startGame = function () {
			shuffleDeck();
			dealerIndex = 0;
			playerIndex = 0;
			lastKeyPressed = 0;
			dealMode = DEALER_FIRST;
			lcd.clear();
			if (bank < BET_MIN) {
				// Yes, Hope you have more in the ATM.
				lcd.clear();
				lcd.print("Tapped out!");
				displayBank(1);
				setTimeout(visitATM, 2000);
			}
			else if (bank >= BANK_MAX) {
				// Broke the Casino.
				lcd.clear();
				displayBank(0);
				lcd.setCursor(0, 1);
				lcd.print("Select new table");
				bank = BANK_INIT;
				// Wait for player to press Select.
				mode = MODE_STARTOVER;
			}
			else {
				mode = MODE_GETBET;
				processGetBet();
			}
		};

		//Player out of cash
		visitATM = function () {
			lcd.clear();
			lcd.print("Visit ATM for");
			lcd.setCursor(0, 1);
			lcd.print("Another ");
			lcd.print(toCurrency(BANK_INIT));
			bank += BANK_INIT;
			// Wait for player to press Select.
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Invoked by key press in MODE_GETBET mode
		processGetBet = function () {
			// Prompt user.
			switch (lastKeyPressed) {
				case MORE:
					if ((bet < BET_MAX) && (bet < bank))
						bet += BET_INC;
					else
						beep();
					break;

				case LESS:
					if (bet > BET_MIN)
						bet -= BET_INC;
					else
						beep();
					break;

				case STAND:
					beep();
					break;

				case HIT:
					if ((bet <= BET_MAX) && (bet <= bank)) {
						mode = MODE_NOINPUT

						// Deal initial hand.
						dealMode = 0;
						setTimeout(dealCard, 0);
					}
					break;
			}
			// Show player how much they have.
			displayBank(0);
			lcdClearRow(1);
			lcd.print("Your Bet? ");
			lcd.print(toCurrency(bet));
		};

		//Gets next card from deck and shuffles if necessaty.
		//dealMode controls where this function returns to.
		dealCard = function () {
			var delay = 0;
			deckCard = deck[deckIndex];
			deckIndex++;
			if (deckIndex >= TOTAL_CARDS) {
				// No, Shuffle the deck.
				lcd.clear();
				lcd.print("Shuffling");
				// Init temporary card.
				shuffleDeck();
				// Init card index.
				deckIndex = 0;
				// Slow humans.
				delay = 2000;
			}
			if (dealMode == PLAYER_NEXT)
				setTimeout(processPlayerHit, delay);
			else if (dealMode == DEALER_NEXT)
				setTimeout(processDealerHit, delay);
			else
				setTimeout(processDealShow, delay);
		};
		
		//Deals dealers and players first two cards
		processDealShow = function () {
			// Deal card.
			if (dealMode == DEALER_FIRST)
				dealerHoldCard = deckCard;
			if ((dealMode & 1) == 0) {
				dealerHand[dealerIndex] = deckCard;
				dealerIndex++;
			}
			else {
				playerHand[playerIndex] = deckCard;
				playerIndex++;
			}
			displayHands();
			dealMode++;
			if (dealMode == PLAYER_NEXT)
				setTimeout(processTestCards, 0);
			else
				setTimeout(dealCard, 0);
		};

		//Tests whether dealer or player has a blackjack
		processTestCards = function () {
			//cards are now dealt
			if ((dealerIndex == 2) && (countCards(dealerHand, dealerIndex) == 21)) {
				//Dealer has black jack
				dealerHoldCard = 0;
				displayHands();
				lcd.setCursor(7, 0);
				lcd.print("Blackjack");
				// Give player the bad news.
				setTimeout(dealerBlackjack, 2000);
			}
			else if ((playerIndex == 2) && (countCards(playerHand, playerIndex) == 21)) {
				dealerHoldCard = 0;
				displayHands();
				lcd.setCursor(7, 1);
				lcd.print("Blackjack");
				setTimeout(playerBlackjack, 2000);
			}
			else {
				//Accept hits until player stands or busts
				lcd.setCursor(9, 0);
				lcd.print("H or S?");
				mode = MODE_HITORSTAND;
			}
		};

		//Player has blackjack
		playerBlackjack = function () {
			lcd.clear();
			lcd.print("Player Blackjack");
			lcd.setCursor(0, 1);
			lcd.print("You Win ");
			lcd.print(toCurrency(bet * 1.5));
			bank += bet * 1.5;
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Player wins
		playerWin = function () {
			// Player wins.
			lcd.clear();
			lcd.print("Player Wins!");
			lcd.setCursor(0, 1);
			lcd.print("You Win  ");
			lcd.print(toCurrency(bet));
			bank += bet;
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Player busts
		playerBust = function () {
			lcd.clear();
			lcd.print("Player Busts!");
			lcd.setCursor(0, 1);
			lcd.print("You Lose ");
			lcd.print(toCurrency(bet));
			bank -= bet;
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Dealer has blackjack
		dealerBlackjack = function () {
			// Player Blackjack?
			lcd.setCursor(7, 1);
			if ((playerIndex == 2) && (countCards(playerHand, playerIndex) == 21)) {
				// Yes, Push.
				lcd.print("Draw!");
			}
			else {
				// No, Loser.
				lcd.print("You Lose!");
				bank -= bet;
			}
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Dealer wins
		dealerWin = function () {
			// Dealer wins.
			lcd.clear();
			lcd.print("Dealer Wins!");
			lcd.setCursor(0, 1);
			lcd.print("You Lose ");
			lcd.print(toCurrency(bet));
			bank -= bet;
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Dealer busts
		dealerBust = function () {
			lcd.clear();
			lcd.print("Dealer Busts!");
			lcd.setCursor(0, 1);
			lcd.print("You Win ");
			lcd.print(toCurrency(bet));
			bank += bet;
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Draw
		playerPush = function () {
			lcd.clear();
			lcd.print("Draw!");
			lastKeyPressed = 0;
			mode = MODE_STARTOVER;
		};

		//Invoked by key press in MODE_HITORSTAND mode
		processHitStand = function () {
			switch (lastKeyPressed) {
				case HIT:
					dealMode = PLAYER_NEXT;
					setTimeout(dealCard, 0);
					break;

				case STAND:
					mode = MODE_NOINPUT;
					dealerHoldCard = 0;
					setTimeout(dealerHit, 0);
					break;

				case LESS:
				case MORE:
					beep();
					break;
			}
		}

		//Player has requested another card
		processPlayerHit = function () {
			playerHand[playerIndex] = deckCard;
			playerIndex++;
			displayHands();
			lcd.setCursor(9, 0);
			lcd.print("H or S?");
			var playerCount = countCards(playerHand, playerIndex);
			if (playerCount > 21) {
				dealerHoldCard = 0;
				displayHands();
				var dealerCount = countCards(dealerHand, dealerIndex);
				displayCount(dealerCount, 0);
				displayCount(playerCount, 1);
				mode = MODE_NOINPUT;
				setTimeout(playerBust, 2000);
			}
		}

		//Player has stood, start playing dealers hand
		dealerHit = function () {
			//Play out dealers hand - dealer must draw on 16 or less
			var dealerCount = countCards(dealerHand, dealerIndex);
			var playerCount = countCards(playerHand, playerIndex);
			if (dealerCount < 17) {
				dealMode = DEALER_NEXT;
				setTimeout(dealCard, 0);
			}
			else {
				displayHands();
				displayCount(dealerCount, 0);
				displayCount(playerCount, 1);
				if (dealerCount > 21)
					setTimeout(dealerBust, 2000);
				else if (dealerCount > playerCount)
					setTimeout(dealerWin, 2000);
				else if (dealerCount < playerCount)
					setTimeout(playerWin, 2000);
				else
					setTimeout(playerPush, 2000);
			}
		}

		//Dealer was forced to requested another card
		processDealerHit = function () {
			dealerHand[dealerIndex] = deckCard;
			dealerIndex++;
			displayHands();
			setTimeout(dealerHit, 1000);
		}

		//Return random number (min <= x < max)
		random = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		};

		//Randomize the deck
		shuffleDeck = function () {
			//Create deck - shuffle
			for (var card = 0; card < 52; card++) {
				deck[card] = 0;
			}
			for (var card = 1; card <= 52; card++) {
				var retries = 0;
				while (retries < 50) {
					var pos = random(0, 52);
					if (deck[pos] == 0) {
						deck[pos] = card;
						break;
					}
					retries++;
				}
				if (retries == 50) {
					for (var pos = 0; pos < 51; pos++) {
						if (deck[pos] == 0) {
							deck[pos] = card;
							break;
						}
					}
				}
			}
		};

		//Display both dealer and player hands.
		displayHands = function () {
			// Display dealer's hand.
			lcd.clear();
			lcd.print("D:");
			displayHand(dealerHand, dealerIndex, dealerHoldCard);
			// Display player's hand.
			lcd.setCursor(0, 1);
			lcd.print("P:");
			displayHand(playerHand, playerIndex, 0);
		};

		//Display hand.
		displayHand = function (hand, index, hold) {
			// Display cards.
			for (var card = 0; card < index; card++) {
				// Dealer Hole Card?
				if (hand[card] == hold) {
					// Yes, display card back.
					lcd.write(BACK1);
					lcd.write(BACK2);
				}
				else {
					var face = (hand[card] - 1) % 13 + 1;
					var suit = Math.floor((hand[card] - 1) / 13);

					// No, display card rank.
					switch (face) {
						case 1:
							lcd.print("A");
							break;
						case 10:
							lcd.write(TEN);
							break;
						case 11:
							lcd.print("J");
							break;
						case 12:
							lcd.print("Q");
							break;
						case 13:
							lcd.print("K");
							break;
						default:
							lcd.write(face + 48);
							break;
					}
					// Display card suit.
					lcd.write(suit);
				}
			}
		};

		//Displays a number on the far right of a line
		displayCount = function (count, line) {
			if (count > 9)
				lcd.setCursor(14, line)
			else
				lcd.setCursor(15, line);
			lcd.print(count + "");
		};

		//Counts the cards in a hand
		countCards = function (hand, cards) {
			var count = 0;
			var aces = 0;
			for (var card = 0; card < cards; card++) {
				var face = (hand[card] - 1) % 13 + 1;
				if (face == 1) {
					count = count + 1;
					aces = aces + 1;
				}
				else if (face > 10)
					count = count + 10;
				else
					count = count + face;
			}
			while ((aces > 0) && (count < 12)) {
				count = count + 10;
				aces = aces - 1;
			}
			return count;
		}

		// Clear LCD single row.
		// Leaves cursor at the beginning of the cleared row.
		lcdClearRow = function (row) {
			if ((row >= 0) && (row < 2)) {
				lcd.setCursor(0, row);
				for (var x = 0; x < 16; x++) {
					lcd.print(" ");
				}
				lcd.setCursor(0, row);
			}
		};

		// Display bank.
		// Parameter determines LCD row.
		displayBank = function (row) {
			lcdClearRow(row);
			lcd.print("Bank ");
			lcd.print(toCurrency(bank));
		};

		beep = function () {
		};

		// Convert long to currency string.
		toCurrency = function (value) {
			return "$" + Math.floor(value / 100) + "." + ((value % 100) + "0").substr(0, 2);
		};

		//Initailise Blackjack and start playing
		initialse();
		setTimeout(startSequence, 0);
	});


})(jQuery);
