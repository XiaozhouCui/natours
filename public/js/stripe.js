import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51HVW3EHYqqt7LijuiCYykwM4gLQVeFRriyYu7GHjme9BY2t29hEZiWeWR61zzERZImNF4fKLrWtL15wMf50UwB0V00BAU8eUUW'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://localhost:3001/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
