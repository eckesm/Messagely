const express = require('express');
const router = new express.Router();
const ExpressError = require('../expressError');
const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', async (req, res, next) => {
	try {
		const message = await Message.get(req.params.id);
		if (message.from_user.username === req.user.username || message.to_user.username === req.user.username) {
			return res.json({ message });
		}
		else {
			throw new ExpressError(`You are not authorized to view message with id: ${id}`, 400);
		}
	} catch (e) {
		return next(e);
	}
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', async (req, res, next) => {
	try {
		const { to_username, body } = req.body;
		if (!to_username || !body) {
			throw new ExpressError(`to_username and body are required.`, 400);
		}
		const message = await Message.create({
			from_username : req.user.username,
			to_username,
			body
		});
		return res.json({ message });
	} catch (e) {
		return next(e);
	}
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', async (req, res, next) => {
	try {
		const { id } = req.params;
		let message = await Message.get(id);

		if (message.to_user.username === req.user.username) {
			message = await Message.markRead(id);
			return res.json({ message });
		}
		else {
			throw new ExpressError(`You are not authorized to mark message ${id} as read.`, 400);
		}
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
