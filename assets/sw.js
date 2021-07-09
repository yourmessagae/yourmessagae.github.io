'use strict';

function isClientFocused() {
    return clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((windowClients) => {
            let clientIsFocused = false;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.focused) {
                    clientIsFocused = true;
                    break;
                }
            }

            return clientIsFocused;
        });
}

self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    var data = event.data.json();

    const promiseChain = isClientFocused()

    .then((clientIsFocused) => {
        if (clientIsFocused) {
            return clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function(windowClients) {
                windowClients.forEach(function(windowClient) {
                    windowClient.postMessage(data);
                });
            });
        }

        const title = data.Title;
        const options = {
            body: data.Message,
            icon: data.Icon,
            badge: 'assets/images/logo.png',
            data: data.Url
        };

        // Client isn't focused, we need to show a notification.
        return self.registration.showNotification(title, options);
    });

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
    const urlToOpen = new URL(event.notification.data, self.location.origin).href;

    event.notification.close();

    const promiseChain = clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url === urlToOpen) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        });

    event.waitUntil(promiseChain);
});