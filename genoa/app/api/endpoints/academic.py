"""
Academic Improvement API Endpoints

This module provides API endpoints for academic improvement and study plan generation.
"""

from fastapi import APIRouter, HTTPException

from app.models.academic import StudyPlanRequest, StudyPlanResponse

router = APIRouter(prefix="/academic", tags=["academic"])

@router.post("/improvement", response_model=StudyPlanResponse)
async def academic_improvement(request: StudyPlanRequest):
    """
    Generate a personalized study plan to help improve grades in a specific subject.

    This endpoint analyzes past performance, identifies areas for improvement,
    and creates a detailed study plan based on upcoming assignments and tests.
    """
    try:
        # Get Canvas service using utility function
        from app.utils.common import get_canvas_service
        canvas_service = await get_canvas_service()

        # We don't need Canvas tools for this endpoint, just the service

        # Prepare a fallback response
        fallback_response = {
            "response": "I'm having trouble analyzing your academic performance at the moment. Here are your courses:",
            "study_plan": {},
            "conversation_id": request.conversation_id or "new_conversation"
        }

        try:
            # Get courses for the fallback response
            courses = await canvas_service.get_courses()
            if courses:
                course_list = "\n".join([f"- {course.get('name', 'Unnamed course')} (ID: {course.get('id', 'N/A')})" for course in courses])
                fallback_response["response"] += f"\n\n{course_list}\n\nTo improve your grades, please select a specific course and I can provide more detailed advice."
        except Exception as e:
            print(f"Error getting courses: {e}")

        # If a course ID is provided, try to generate a study plan
        if request.course_id:
            try:
                study_plan = await canvas_service.generate_study_plan(request.course_id, request.days_ahead)

                # Create a response with the study plan
                response_text = f"Here's a personalized study plan for improving your grade in {study_plan.get('course_name', 'your course')}."

                if study_plan.get('current_grade'):
                    response_text += f" Your current grade is {study_plan.get('current_grade')}."

                if study_plan.get('strengths'):
                    response_text += f"\n\nYour strengths are in: {', '.join(study_plan.get('strengths'))}."

                if study_plan.get('weaknesses'):
                    response_text += f"\n\nYou should focus on improving: {', '.join(study_plan.get('weaknesses'))}."

                if study_plan.get('upcoming_assignments'):
                    response_text += "\n\nPrioritize these upcoming assignments:"
                    for i, assignment in enumerate(study_plan.get('upcoming_assignments')[:3], 1):
                        response_text += f"\n{i}. {assignment.get('name')}"
                        if assignment.get('due_date'):
                            response_text += f" (Due: {assignment.get('due_date')})"

                return StudyPlanResponse(
                    response=response_text,
                    study_plan=study_plan,
                    conversation_id=request.conversation_id or "new_conversation"
                )
            except Exception as e:
                print(f"Error generating study plan: {e}")
                # Continue with fallback response

        # If subject is provided but no course ID, try to find the course
        elif request.subject:
            try:
                courses = await canvas_service.get_courses()
                matching_courses = []

                # Create a more flexible matching system
                subject_keywords = request.subject.lower().split()

                # Add common variations and synonyms
                if 'english' in subject_keywords:
                    subject_keywords.extend(['composition', 'writing', 'literature', 'lang'])
                elif 'math' in subject_keywords:
                    subject_keywords.extend(['algebra', 'calculus', 'geometry', 'statistics'])
                elif 'science' in subject_keywords:
                    subject_keywords.extend(['biology', 'chemistry', 'physics', 'lab'])
                elif 'history' in subject_keywords:
                    subject_keywords.extend(['world', 'american', 'european', 'civilization'])

                # Score each course based on keyword matches
                scored_courses = []
                for course in courses:
                    course_name = course.get('name', '').lower()
                    score = 0

                    # Check for exact subject match
                    if request.subject.lower() in course_name:
                        score += 10

                    # Check for individual keyword matches
                    for keyword in subject_keywords:
                        if keyword in course_name:
                            score += 3

                    # Prioritize active courses
                    if course.get('workflow_state') == 'available':
                        score += 2

                    # Add to list if there's any match
                    if score > 0:
                        scored_courses.append((course, score))

                # Sort by score (highest first)
                scored_courses.sort(key=lambda x: x[1], reverse=True)

                # Convert to list of courses (ignoring scores)
                matching_courses = [course for course, _ in scored_courses]

                if matching_courses:
                    # Use the first matching course
                    course = matching_courses[0]
                    course_id = course.get('id')

                    # Generate study plan for this course
                    study_plan = await canvas_service.generate_study_plan(course_id, request.days_ahead)

                    # Create a response with the study plan
                    response_text = f"I found a course that matches '{request.subject}': {course.get('name')}. Here's a personalized study plan for improving your grade."

                    if study_plan.get('current_grade'):
                        response_text += f" Your current grade is {study_plan.get('current_grade')}."

                    if study_plan.get('strengths'):
                        response_text += f"\n\nYour strengths are in: {', '.join(study_plan.get('strengths'))}."

                    if study_plan.get('weaknesses'):
                        response_text += f"\n\nYou should focus on improving: {', '.join(study_plan.get('weaknesses'))}."

                    if study_plan.get('upcoming_assignments'):
                        response_text += "\n\nPrioritize these upcoming assignments:"
                        for i, assignment in enumerate(study_plan.get('upcoming_assignments')[:3], 1):
                            response_text += f"\n{i}. {assignment.get('name')}"
                            if assignment.get('due_date'):
                                response_text += f" (Due: {assignment.get('due_date')})"

                    return StudyPlanResponse(
                        response=response_text,
                        study_plan=study_plan,
                        conversation_id=request.conversation_id or "new_conversation"
                    )
                else:
                    # No matching course found
                    return StudyPlanResponse(
                        response=f"I couldn't find a course that matches '{request.subject}'. Here are your courses:\n\n" +
                                 "\n".join([f"- {course.get('name', 'Unnamed course')} (ID: {course.get('id', 'N/A')})" for course in courses]),
                        study_plan={},
                        conversation_id=request.conversation_id or "new_conversation"
                    )
            except Exception as e:
                print(f"Error finding course by subject: {e}")
                # Continue with fallback response

        # If we get here, use the fallback response
        return StudyPlanResponse(**fallback_response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
