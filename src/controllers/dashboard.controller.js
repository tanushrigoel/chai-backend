import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get the channel which is also user
    // use aggregate pipelines first get all videos of that channel, then in those videos count the total number of views
    // count the total videos
    // look in subscribers, count the total subscribers for that particular user
    // from likes look for the particular videos of the user and then count total likes

    const channelStats={}

    const videoStats = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $project:{
                Totalvideos:{
                    $count:{}
                },
                Totalviews:{
                    $sum:"$views"
                }
            }
        }
    ])

    // likes on videos and then comments on particular videos of channels
    // likes on tweets match the owner

    const likeStats = await Like.aggregate([
        { // only that particular video that is of that owner
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"like",
                pipeline:[
                    {
                        $match:{
                            $owner:new mongoose.Types.ObjectId(req.user._id)
                        }
                    }
                ]
            }
        },{
            $project:{
                TotalLikes:{
                    $count:{}
                }
            }
        }
    ])


    const subscribers = await Subscription.aggregate([
        {
            $match:{
                $channel:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $project:{
                TotalSubscribers:{
                    $count:{}
                }
            }
        }
    ])

    channelStats.ownerName=req.user?.fullname
    channelStats.Totalviews=(videoStats && videoStats[0]?.Totalviews) || 0
    channelStats.Totalvideos=(videoStats && videoStats[0]?.Totalvideos) || 0
    channelStats.TotalSubscribers=(subscribers && subscribers[0]?.TotalSubscribers) || 0
    channelStats.TotalLikes=(likeStats && likeStats[0]?.TotalLikes) || 0

    return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Data about channel fetched successfully"))


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // look into videos for all the videos uploaded by the user

    const allVideos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"like"
            }
        },{
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comment"
            }
        },{
            $project:{
                title:1,
                thumbnail:1,
                duration:1,
                views:1,
                createdAt:1,
                updatedAt:1,
                isPublished:1,
                likesCount:{
                    $size:"$like"
                },
                commentsCount:{
                    $size:"$comment"
                }

            }
        }
    ])

    if(!allVideos){
        throw new ApiError(404, "Can't get channel videos")
    }


    return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "fetched all videos successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }