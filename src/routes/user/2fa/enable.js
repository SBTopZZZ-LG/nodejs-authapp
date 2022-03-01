const Router = require("express").Router()
const TwoFA = require("../../../configs/2fa.json")
const LoginTokenAuth = require("../../../middlewares/login_token.auth")

Router.post("/user/2fa/enable", LoginTokenAuth, async (req, res, next) => {
    try {
        const body = req.body

        const data = body["data"]
        if (!data)
            return res.status(400).send({
                error: "missingData",
                result: {}
            })

        const first_question = data["first_question"]
        if (!req.user["two_factor_auth"]["first_question"]["question"] && !first_question)
            return res.status(400).send({
                error: "missingFirstQuestion",
                result: {}
            })

        const second_question = data["second_question"]
        if (!req.user["two_factor_auth"]["second_question"]["question"] && !second_question)
            return res.status(400).send({
                error: "missingSecondQuestion",
                result: {}
            })

        const third_question = data["third_question"]
        if (!req.user["two_factor_auth"]["third_question"]["question"] && !third_question)
            return res.status(400).send({
                error: "missingThirdQuestion",
                result: {}
            })

        if (first_question) {
            if ("question" in first_question && first_question["question"])
                if (!TwoFA.questions.includes(first_question["question"]))
                    return res.status(403).send({
                        error: "firstQuestionUnverified",
                        result: {}
                    })
                else if (!("answer" in first_question && first_question["answer"]))
                    return res.status(400).send({
                        error: "firstQuestionAnswerMissing",
                        result: {}
                    })
                else {
                    req.user["two_factor_auth"]["first_question"]["question"] = first_question["question"]
                    req.user["two_factor_auth"]["first_question"]["answer"] = first_question["answer"]
                }
        }
        if (second_question) {
            if (!TwoFA.questions.includes(second_question["question"]))
                return res.status(403).send({
                    error: "secondQuestionUnverified",
                    result: {}
                })
            else if (!("answer" in second_question && second_question["answer"]))
                return res.status(400).send({
                    error: "secondQuestionAnswerMissing",
                    result: {}
                })
            else {
                req.user["two_factor_auth"]["second_question"]["question"] = second_question["question"]
                req.user["two_factor_auth"]["second_question"]["answer"] = second_question["answer"]
            }
        }
        if (third_question) {
            if (!TwoFA.questions.includes(third_question["question"]))
                return res.status(403).send({
                    error: "thirdQuestionUnverified",
                    result: {}
                })
            else if (!("answer" in third_question && third_question["answer"]))
                return res.status(400).send({
                    error: "thirdQuestionAnswerMissing",
                    result: {}
                })
            else {
                req.user["two_factor_auth"]["third_question"]["question"] = third_question["question"]
                req.user["two_factor_auth"]["third_question"]["answer"] = third_question["answer"]
            }
        }

        const recorded_questions = []
        if (req.user["two_factor_auth"]["first_question"]["question"])
            recorded_questions.push(req.user["two_factor_auth"]["first_question"]["question"])

        if (req.user["two_factor_auth"]["second_question"]["question"])
            if (recorded_questions.includes(req.user["two_factor_auth"]["second_question"]["question"]))
                return res.status(403).send({
                    error: "duplicateQuestions",
                    result: {}
                })
            else
                recorded_questions.push(req.user["two_factor_auth"]["second_question"]["question"])

        if (req.user["two_factor_auth"]["third_question"]["question"])
            if (recorded_questions.includes(req.user["two_factor_auth"]["third_question"]["question"]))
                return res.status(403).send({
                    error: "duplicateQuestions",
                    result: {}
                })
            else
                recorded_questions.push(req.user["two_factor_auth"]["third_question"]["question"])

        req.user["two_factor_auth"]["isEnabled"] = true
        await req.user.save()

        return res.status(200).send({
            error: null,
            result: {
                "2fa": req.user["two_factor_auth"]
            }
        })
    } catch (e) {
        return res.status(500).send({
            error: e.toString(),
            result: {}
        })
    }
})

module.exports = Router