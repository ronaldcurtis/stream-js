import StreamUser from './user';
import errors from './errors';
import utils from './utils';

/**
 * Manage api calls for specific feeds
 * The feed object contains convenience functions such add activity, remove activity etc
 * @class StreamFeed
 */
export default class StreamFeed {
  constructor(client, feedSlug, userId, token) {
    /**
     * Initialize a feed object
     * @method constructor
     * @memberof StreamFeed.prototype
     * @param {StreamClient} client - The stream client this feed is constructed from
     * @param {string} feedSlug - The feed slug
     * @param {string} userId - The user id
     * @param {string} [token] - The authentication token
     */

    if (!feedSlug || !userId) {
      throw new errors.FeedError('Please provide a feed slug and user id, ie client.feed("user", "1")');
    }

    if (feedSlug.indexOf(':') !== -1) {
      throw new errors.FeedError('Please initialize the feed using client.feed("user", "1") not client.feed("user:1")');
    }

    utils.validateFeedSlug(feedSlug);
    utils.validateUserId(userId);

    // raise an error if there is no token
    if (!token) {
      throw new errors.FeedError('Missing token, in client side mode please provide a feed secret');
    }

    this.client = client;
    this.slug = feedSlug;
    this.userId = userId;
    this.id = `${this.slug}:${this.userId}`;
    this.token = token;

    this.feedUrl = this.id.replace(':', '/');
    this.feedTogether = this.id.replace(':', '');
    this.signature = `${this.feedTogether} ${this.token}`;

    // faye setup
    this.notificationChannel = `site-${this.client.appId}-feed-${this.feedTogether}`;

    this.enrichByDefault = false;
  }

  addActivity(activity) {
    /**
     * Adds the given activity to the feed
     * @method addActivity
     * @memberof StreamFeed.prototype
     * @param {object} activity - The activity to add
     * @return {Promise} Promise object
     */

    activity = utils.replaceStreamObjects(activity);
    if (!activity.actor && this.client.currentUser) {
      activity.actor = this.client.currentUser.ref();
    }

    return this.client.post({
      url: `feed/${this.feedUrl}/`,
      body: activity,
      signature: this.signature,
    });
  }

  removeActivity(activityId) {
    /**
     * Removes the activity by activityId
     * @method removeActivity
     * @memberof StreamFeed.prototype
     * @param  {string}   activityId Identifier of activity to remove
     * @return {Promise} Promise object
     * @example
     * feed.removeActivity(activityId);
     * @example
     * feed.removeActivity({'foreignId': foreignId});
     */
    return this.client.delete({
      url: `feed/${this.feedUrl}/${activityId.foreignId || activityId}/`,
      qs: activityId.foreignId ? { foreign_id: '1' } : {},
      signature: this.signature,
    });
  }

  addActivities(activities) {
    /**
     * Adds the given activities to the feed
     * @method addActivities
     * @memberof StreamFeed.prototype
     * @param  {Array}   activities Array of activities to add
     * @return {Promise}               XHR request object
     */
    return this.client.post({
      url: `feed/${this.feedUrl}/`,
      body: { activities: utils.replaceStreamObjects(activities) },
      signature: this.signature,
    });
  }

  follow(targetSlug, targetUserId, options = {}) {
    /**
     * Follows the given target feed
     * @method follow
     * @memberof StreamFeed.prototype
     * @param  {string}   targetSlug   Slug of the target feed
     * @param  {string}   targetUserId User identifier of the target feed
     * @param  {object}   options      Additional options
     * @param  {number}   options.activityCopyLimit Limit the amount of activities copied over on follow
     * @return {Promise}  Promise object
     * @example feed.follow('user', '1');
     * @example feed.follow('user', '1');
     * @example feed.follow('user', '1', options);
     */
    if (targetUserId instanceof StreamUser) {
      targetUserId = targetUserId.id;
    }
    utils.validateFeedSlug(targetSlug);
    utils.validateUserId(targetUserId);

    const body = { target: `${targetSlug}:${targetUserId}` };
    if (typeof options.limit === 'number') body.activity_copy_limit = options.limit;

    return this.client.post({
      url: `feed/${this.feedUrl}/following/`,
      body,
      signature: this.signature,
    });
  }

  unfollow(targetSlug, targetUserId, options = {}) {
    /**
     * Unfollow the given feed
     * @method unfollow
     * @memberof StreamFeed.prototype
     * @param  {string}   targetSlug   Slug of the target feed
     * @param  {string}   targetUserId [description]
     * @param  {object} options
     * @param  {boolean}  options.keepHistory when provided the activities from target
     *                                                 feed will not be kept in the feed
     * @return {object}                XHR request object
     * @example feed.unfollow('user', '2');
     */
    const qs = {};
    if (typeof options.keepHistory === 'boolean' && options.keepHistory) qs.keep_history = '1';

    utils.validateFeedSlug(targetSlug);
    utils.validateUserId(targetUserId);
    const targetFeedId = `${targetSlug}:${targetUserId}`;
    return this.client.delete({
      url: `feed/${this.feedUrl}/following/${targetFeedId}/`,
      qs,
      signature: this.signature,
    });
  }

  following(options = {}) {
    /**
     * List which feeds this feed is following
     * @method following
     * @memberof StreamFeed.prototype
     * @param  {object}   options  Additional options
     * @param  {string}   options.filter Filter to apply on search operation
     * @return {Promise} Promise object
     * @example feed.following({limit:10, filter: ['user:1', 'user:2']});
     */
    if (options.filter) {
      options.filter = options.filter.join(',');
    }

    return this.client.get({
      url: `feed/${this.feedUrl}/following/`,
      qs: options,
      signature: this.signature,
    });
  }

  followers(options = {}) {
    /**
     * List the followers of this feed
     * @method followers
     * @memberof StreamFeed.prototype
     * @param  {object}   options  Additional options
     * @param  {string}   options.filter Filter to apply on search operation
     * @return {Promise} Promise object
     * @example
     * feed.followers({limit:10, filter: ['user:1', 'user:2']});
     */
    if (options.filter) {
      options.filter = options.filter.join(',');
    }

    return this.client.get({
      url: `feed/${this.feedUrl}/followers/`,
      qs: options,
      signature: this.signature,
    });
  }

  get(options = {}) {
    /**
     * Reads the feed
     * @method get
     * @memberof StreamFeed.prototype
     * @param  {object}   options  Additional options
     * @return {Promise} Promise object
     * @example feed.get({limit: 10, id_lte: 'activity-id'})
     * @example feed.get({limit: 10, mark_seen: true})
     */

    if (options.mark_read && options.mark_read.join) {
      options.mark_read = options.mark_read.join(',');
    }

    if (options.mark_seen && options.mark_seen.join) {
      options.mark_seen = options.mark_seen.join(',');
    }

    this.client.replaceReactionOptions(options);

    const path = this.client.shouldUseEnrichEndpoint(options) ? 'enrich/feed/' : 'feed/';

    return this.client.get({
      url: `${path}${this.feedUrl}/`,
      qs: options,
      signature: this.signature,
    });
  }

  getActivityDetail(activityId, options) {
    /**
     * Retrieves one activity from a feed and adds enrichment
     * @method getActivityDetail
     * @memberof StreamFeed.prototype
     * @param  {string}   activityId Identifier of activity to retrieve
     * @param  {object}   options  Additional options
     * @return {Promise} Promise object
     * @example feed.getActivityDetail(activityId)
     * @example feed.getActivityDetail(activityId, {withRecentReactions: true})
     * @example feed.getActivityDetail(activityId, {withReactionCounts: true})
     * @example feed.getActivityDetail(activityId, {withOwnReactions: true, withReactionCounts: true})
     */
    return this.get({ id_lte: activityId, id_gte: activityId, limit: 1, ...(options || {}) });
  }

  getFayeClient() {
    /**
     * Returns the current faye client object
     * @method getFayeClient
     * @memberof StreamFeed.prototype
     * @access private
     * @return {object} Faye client
     */
    return this.client.getFayeClient();
  }

  subscribe(callback) {
    /**
     * Subscribes to any changes in the feed, return a promise
     * @method subscribe
     * @memberof StreamFeed.prototype
     * @param  {function} callback Callback to call on completion
     * @return {Promise}           Promise object
     * @example
     * feed.subscribe(callback).then(function(){
     * 		console.log('we are now listening to changes');
     * });
     */
    if (!this.client.appId) {
      throw new errors.SiteError(
        'Missing app id, which is needed to subscribe, use var client = stream.connect(key, secret, appId);',
      );
    }

    const subscription = this.getFayeClient().subscribe(`/${this.notificationChannel}`, callback);
    this.client.subscriptions[`/${this.notificationChannel}`] = {
      token: this.token,
      userId: this.notificationChannel,
      fayeSubscription: subscription,
    };

    return subscription;
  }

  unsubscribe() {
    /**
     * Cancel updates created via feed.subscribe()
     * @return void
     */
    const streamSubscription = this.client.subscriptions[`/${this.notificationChannel}`];
    if (streamSubscription) {
      delete this.client.subscriptions[`/${this.notificationChannel}`];
      streamSubscription.fayeSubscription.cancel();
    }
  }

  updateActivityToTargets(foreignId, time, newTargets, addedTargets, removedTargets) {
    /**
     * Updates an activity's "to" fields
     * @since 3.10.0
     * @param {string} foreignId The foreign_id of the activity to update
     * @param {string} time The time of the activity to update
     * @param {array} newTargets Set the new "to" targets for the activity - will remove old targets
     * @param {array} added_targets Add these new targets to the activity
     * @param {array} removedTargets Remove these targets from the activity
     */

    if (!foreignId) {
      throw new Error('Missing `foreign_id` parameter!');
    } else if (!time) {
      throw new Error('Missing `time` parameter!');
    }

    if (!newTargets && !addedTargets && !removedTargets) {
      throw new Error(
        'Requires you to provide at least one parameter for `newTargets`, `addedTargets`, or `removedTargets` - example: `updateActivityToTargets("foreignID:1234", new Date(), [newTargets...], [addedTargets...], [removedTargets...])`',
      );
    }

    if (newTargets) {
      if (addedTargets || removedTargets) {
        throw new Error("Can't include add_targets or removedTargets if you're also including newTargets");
      }
    }

    if (addedTargets && removedTargets) {
      // brute force - iterate through added, check to see if removed contains that element
      addedTargets.forEach((addedTarget) => {
        if (removedTargets.includes(addedTarget)) {
          throw new Error("Can't have the same feed ID in addedTargets and removedTargets.");
        }
      });
    }

    const body = { foreign_id: foreignId, time };
    if (newTargets) body.new_targets = newTargets;
    if (addedTargets) body.added_targets = addedTargets;
    if (removedTargets) body.removed_targets = removedTargets;

    return this.client.post({
      url: `feed_targets/${this.feedUrl}/activity_to_targets/`,
      signature: this.signature,
      body,
    });
  }
}
