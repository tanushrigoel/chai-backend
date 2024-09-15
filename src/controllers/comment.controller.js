import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video ID does not exist");
    }

    const options={
        page, limit
    }

    const comments=await Comment.aggregate([
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"comment"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            _id:1
                        }
                    }
                ]
            }
        },{
            $project:{
                content:1,
                owner:1,
                createdAt:1,
                updatedAt:1,
                likesCount:{
                    $size:"$likes"
                },
                
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, comments, "All comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "Video Id is wrong")
    }

    if(!content){
        throw new ApiError(400, "Comment can't be empty")
    }


    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user
    })

    if(!comment){
        throw new ApiError(404, "Error while creating comment")
    }

    return res.status(200).json(new ApiResponse(200, comment, "comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {videoId} = req.params
    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "videoId is wrong")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "comment ID not provided")
    }
    if(!content.trim()){
        throw new ApiError(404, "Content to be updated can't be empty")
    }

    const comment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },{
            new:true
        }
    )
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(404, "comment id is not valid");
    }

    const comment=await Comment.findByIdAndDelete(commentId);

    if(!comment){
        throw new ApiError(200, "Comment can't be deleted")
    }

    const commentLikes=await Like.deleteMany({
        comment:new mongoose.Types.ObjectId(commentId)
    })

    if(!commentLikes){
        throw new ApiError(400, "Likes of the comment can't be deleted")
    }

    return res.status(200).json(new ApiResponse(200, {isDeleted:true}, "Comment deleted successfully"))


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
