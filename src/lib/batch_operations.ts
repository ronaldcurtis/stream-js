import StreamClient, { APIResponse, FollowRelation } from './client';
import utils from './utils';

function addToMany<T>(this: StreamClient, activity: T, feeds: string[]): Promise<APIResponse> {
  /**
   * Add one activity to many feeds
   * @method addToMany
   * @memberof StreamClient.prototype
   * @since 2.3.0
   * @param  {object}   activity The activity to add
   * @param  {Array}   feeds    Array of objects describing the feeds to add to
   * @return {Promise}           Promise object
   */
  this._throwMissingApiSecret();

  return this.post<APIResponse>({
    url: 'feed/add_to_many/',
    body: {
      activity: utils.replaceStreamObjects(activity),
      feeds,
    },
    signature: this.getOrCreateToken(),
  });
}

function followMany(this: StreamClient, follows: FollowRelation[], activityCopyLimit?: number): Promise<APIResponse> {
  /**
   * Follow multiple feeds with one API call
   * @method followMany
   * @memberof StreamClient.prototype
   * @since 2.3.0
   * @param  {Array}   follows  The follow relations to create
   * @param  {number}  [activityCopyLimit] How many activities should be copied from the target feed
   * @return {Promise}           Promise object
   */
  this._throwMissingApiSecret();

  const qs: { activity_copy_limit?: number } = {};
  if (typeof activityCopyLimit === 'number') qs.activity_copy_limit = activityCopyLimit;

  return this.post<APIResponse>({
    url: 'follow_many/',
    body: follows,
    qs,
    signature: this.getOrCreateToken(),
  });
}

function unfollowMany(this: StreamClient, unfollows: FollowRelation[]): Promise<APIResponse> {
  /**
   * Unfollow multiple feeds with one API call
   * @method unfollowMany
   * @memberof StreamClient.prototype
   * @since 3.15.0
   * @param  {Array}   unfollows  The follow relations to remove
   * @return {Promise}           Promise object
   */
  this._throwMissingApiSecret();

  return this.post<APIResponse>({
    url: 'unfollow_many/',
    body: unfollows,
    signature: this.getOrCreateToken(),
  });
}

export default {
  addToMany,
  followMany,
  unfollowMany,
};