import { useEffect, useRef, useState } from 'react';
import {
	AppEvents,
	QueueInteractionScore,
	renderWidget,
	useAPIEventListener,
	usePlugin,
} from '@remnote/plugin-sdk';
import { buttonToScoreMapping } from './funcs/buttonMapping';

function GamepadInput() {
	const gamepadIndex = useRef(-1);
	const [buttonReleased, setButtonReleased] = useState(false);
	const [buttonIndex, setButtonIndex] = useState(-1);
	const prevButtonStates = useRef<Array<boolean>>([]);
	const [showedAnswer, setShowedAnswer] = useState(false);
	const [isLookback, setIsLookback] = useState(false);
	const plugin = usePlugin();

	useAPIEventListener(AppEvents.QueueLoadCard, undefined, async (e) => {
		setTimeout(async () => {
			const lookback = await plugin.queue.inLookbackMode();
			setIsLookback(lookback || false);
		}, 100);
	});

	useEffect(() => {
		const handleGamepadConnected = (event: { gamepad: { index: number } }) => {
			console.log('Gamepad connected:', event.gamepad.index);
			if (event.gamepad.mapping !== 'standard') {
				console.warn('Gamepad mapping is not standard. Please use a standard mapping.'); //TODO: SUPPORT NON-STANDARD MAPPINGS
			}
			gamepadIndex.current = event.gamepad.index;
			startGamepadInputListener();
			// TODO: set up UI examples
		};

		window.addEventListener('gamepadconnected', handleGamepadConnected);

		return () => {
			window.removeEventListener('gamepadconnected', handleGamepadConnected);
		};
	}, []);

	const startGamepadInputListener = () => {
		const interval = setInterval(() => {
			const gamepads = navigator.getGamepads();
			const gamepad = gamepads[gamepadIndex.current];
			if (gamepad) {
				gamepad.buttons.forEach((button, index) => {
					// If the button is not pressed and the previous state was pressed
					if (!button.pressed && prevButtonStates.current[index]) {
						setButtonIndex(index);
						setButtonReleased(true);
					}
					// Update the previous button state
					prevButtonStates.current[index] = button.pressed;
				});
			}
		}, 1);

		return () => clearInterval(interval);
	};

	// use effect to listen for when the button is released
	useEffect(() => {
		if (buttonReleased) {
			console.log('Button released:', buttonIndex);
			setButtonReleased(false);
			// TODO: handle if we need to change the UI examples to something
			// TODO: IDEA: Since the user can't directly see what they press, let's do a cool, space like flash around the border of the screen representing the color of the button they pressed.

			if (buttonIndex === 9) {
				// TODO: here, we handle lookback mode
			}

			if (!showedAnswer && !isLookback) {
				console.log('showing answer');
				// TODO: SHOW that hover display as if they hovered over the answer
				setShowedAnswer(true);
				plugin.queue.showAnswer();
				return;
			}
			if (showedAnswer) {
				console.log('rating card', buttonToScoreMapping[buttonIndex]);
				setShowedAnswer(false);
				plugin.app.toast(
					`Rated card as ${QueueInteractionScore[buttonToScoreMapping[buttonIndex]]}`
				);
				plugin.queue.rateCurrentCard(Number(buttonToScoreMapping[buttonIndex]));
			}
		}
	}, [buttonReleased, buttonIndex]);

	return <div></div>;
}
renderWidget(GamepadInput);
