-- Cleanup: remove the throwaway user used to send the Twilio delivery test.
DELETE FROM auth.users WHERE lower(email) = 'smstest@halaliy.com';
