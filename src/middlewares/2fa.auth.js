const User = require("../models/user")

module.exports = async (req, res, next) => {
    try {
        const query = req.query
        const body = req.body

        const id = query["id"]
        if (!id)
            return res.status(400).send({
                error: "missingId",
                result: {}
            })

        const first_question_answer = body["first_question_answer"]
        const second_question_answer = body["second_question_answer"]
        const third_question_answer = body["third_question_answer"]
        if (!first_question_answer)
            return res.status(400).send({
                error: "firstQuestionAnswerMissing",
                result: {}
            })
        else if (!second_question_answer)
            return res.status(400).send({
                error: "secondQuestionAnswerMissing",
                result: {}
            })
        else if (!third_question_answer)
            return res.status(400).send({
                error: "thirdQuestionAnswerMissing",
                result: {}
            })

        const user = await User.findById(id).exec()
        if (!user)
            return res.status(404).send({
                error: "userNotFound",
                result: {}
            })

        if (!user["two_factor_auth"]["isEnabled"])
            return res.status(403).send({
                error: "2faDisabled",
                result: {}
            })

        if (!user["two_factor_auth"]["first_question"]["question"] ||
            !user["two_factor_auth"]["second_question"]["question"] || !user["two_factor_auth"]["third_question"]["question"])
            return res.status(403).send({
                error: "missingQuestions",
                result: {}
            })

        if (user["two_factor_auth"]["first_question"]["answer"] !== first_question_answer ||
            user["two_factor_auth"]["second_question"]["answer"] !== second_question_answer || user["two_factor_auth"]["third_question"]["answer"] !== third_question_answer)
            return res.status(403).send({
                error: "incorrectAnswer",
                result: {}
            })

        await user.update() // Check/update avatar url

        req.user = user
        return next()
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
}