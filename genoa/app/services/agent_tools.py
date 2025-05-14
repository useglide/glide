from typing import Dict, List, Any, Optional
from langchain.tools import Tool
from app.services.canvas_service import CanvasService

class CanvasTools:
    """
    A class that provides LangChain tools for accessing Canvas LMS data.
    These tools are used by the AI agent to fetch data on demand.
    """

    def __init__(self, canvas_service: CanvasService):
        """
        Initialize the Canvas tools with a Canvas service instance.

        Args:
            canvas_service: An instance of CanvasService for the current user
        """
        self.canvas_service = canvas_service

    async def get_user_profile(self) -> Dict[str, Any]:
        """Get the current user's profile information."""
        return await self.canvas_service.get_user_info()

    async def list_all_courses(self) -> List[Dict[str, Any]]:
        """Get all available courses for the user."""
        return await self.canvas_service.get_courses()

    async def find_course_by_subject(self, subject: str) -> Dict[str, Any]:
        """Find a course by subject name."""
        courses = await self.canvas_service.get_courses()

        # Create a more flexible matching system
        subject_keywords = subject.lower().split()

        # Add common variations and synonyms
        if 'english' in subject_keywords:
            subject_keywords.extend(['composition', 'writing', 'literature', 'lang', 'eng'])
        elif 'math' in subject_keywords:
            subject_keywords.extend(['algebra', 'calculus', 'geometry', 'statistics', 'math'])
        elif 'science' in subject_keywords:
            subject_keywords.extend(['biology', 'chemistry', 'physics', 'lab', 'sci'])
        elif 'history' in subject_keywords:
            subject_keywords.extend(['world', 'american', 'european', 'civilization', 'hist'])

        # Add grade level variations
        if 'freshman' in subject_keywords or '1' in subject_keywords or 'one' in subject_keywords:
            subject_keywords.extend(['i', '1', 'intro', 'introduction', 'elementary', 'beginning'])
        elif 'sophomore' in subject_keywords or '2' in subject_keywords or 'two' in subject_keywords:
            subject_keywords.extend(['ii', '2', 'intermediate'])
        elif 'junior' in subject_keywords or '3' in subject_keywords or 'three' in subject_keywords:
            subject_keywords.extend(['iii', '3', 'advanced'])
        elif 'senior' in subject_keywords or '4' in subject_keywords or 'four' in subject_keywords:
            subject_keywords.extend(['iv', '4', 'senior'])

        # Score each course based on keyword matches
        scored_courses = []
        for course in courses:
            course_name = course.get('name', '').lower()
            score = 0

            # Check for exact subject match
            if subject.lower() in course_name:
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

        # Return the best match or None
        if scored_courses:
            return scored_courses[0][0]

        return None

    async def get_course_details(self, course_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific course."""
        return await self.canvas_service.get_course(course_id)

    async def get_course_syllabus(self, course_id: int) -> Dict[str, str]:
        """Get the syllabus for a specific course."""
        syllabus = await self.canvas_service.get_course_syllabus(course_id)
        return {"syllabus": syllabus}

    async def get_course_professor(self, course_id: int) -> Dict[str, Any]:
        """Get professor information for a specific course."""
        return await self.canvas_service.get_course_professor(course_id)

    async def list_course_assignments(self, course_id: int) -> List[Dict[str, Any]]:
        """Get all assignments for a specific course."""
        return await self.canvas_service.get_assignments(course_id)

    async def get_assignment_details(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific assignment."""
        return await self.canvas_service.get_assignment(course_id, assignment_id)

    async def get_upcoming_assignments(self, course_id: int, days: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming assignments for a specific course within the specified number of days."""
        return await self.canvas_service.get_upcoming_assignments(course_id, days)

    async def get_all_courses_with_assignments(self) -> Dict[str, Any]:
        """Get all courses with their assignments in one call."""
        return await self.canvas_service.get_two_stage_data()

    async def get_student_submissions(self, course_id: int, assignment_id: int) -> List[Dict[str, Any]]:
        """Get all submissions for a specific assignment."""
        return await self.canvas_service.get_submissions(course_id, assignment_id)

    async def get_student_submission(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Get the current user's submission for a specific assignment."""
        return await self.canvas_service.get_student_submission(course_id, assignment_id)

    async def get_course_grades(self, course_id: int) -> Dict[str, Any]:
        """Get the current user's grades for a specific course."""
        return await self.canvas_service.get_course_grades(course_id)

    async def get_assignment_groups(self, course_id: int) -> List[Dict[str, Any]]:
        """Get assignment groups for a specific course."""
        return await self.canvas_service.get_assignment_groups(course_id)

    async def get_student_submissions_for_course(self, course_id: int) -> List[Dict[str, Any]]:
        """Get all submissions for the current user in a specific course."""
        return await self.canvas_service.get_student_submissions_for_course(course_id)

    async def analyze_course_performance(self, course_id: int) -> Dict[str, Any]:
        """Analyze the current user's performance in a specific course."""
        return await self.canvas_service.analyze_course_performance(course_id)

    async def analyze_assignment_performance(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Analyze the current user's performance on a specific assignment."""
        return await self.canvas_service.analyze_assignment_performance(course_id, assignment_id)

    async def generate_study_plan(self, course_id: int, days_ahead: int = 14) -> Dict[str, Any]:
        """Generate a personalized study plan based on past performance and upcoming assignments."""
        return await self.canvas_service.generate_study_plan(course_id, days_ahead)

    def get_tools(self) -> List[Tool]:
        """
        Get a list of LangChain tools for accessing Canvas LMS data.

        Returns:
            A list of LangChain Tool objects
        """
        return [
            Tool(
                name="get_user_profile",
                func=lambda: self.get_user_profile(),
                description="Get information about the current user's Canvas profile."
            ),
            Tool(
                name="list_all_courses",
                func=lambda: self.list_all_courses(),
                description="Get a list of all available courses for the user."
            ),
            Tool(
                name="find_course_by_subject",
                func=lambda subject: self.find_course_by_subject(subject),
                description="Find a course by subject name. Input should be a subject name like 'English', 'Math', etc. Can also include grade level like 'Freshman English' or 'Calculus 2'."
            ),
            Tool(
                name="get_course_details",
                func=lambda course_id: self.get_course_details(int(course_id)),
                description="Get detailed information for a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="get_course_syllabus",
                func=lambda course_id: self.get_course_syllabus(int(course_id)),
                description="Get the syllabus for a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="get_course_professor",
                func=lambda course_id: self.get_course_professor(int(course_id)),
                description="Get professor information for a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="list_course_assignments",
                func=lambda course_id: self.list_course_assignments(int(course_id)),
                description="Get all assignments for a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="get_assignment_details",
                func=lambda x: self.get_assignment_details(
                    int(x.split(",")[0].strip()),
                    int(x.split(",")[1].strip())
                ),
                description="Get detailed information for a specific assignment. Input should be 'course_id, assignment_id' (both integers)."
            ),
            Tool(
                name="get_upcoming_assignments",
                func=lambda x: self.get_upcoming_assignments(
                    int(x.split(",")[0].strip()),
                    int(x.split(",")[1].strip()) if len(x.split(",")) > 1 else 7
                ),
                description="Get upcoming assignments for a specific course. Input should be 'course_id, days' (both integers). If days is not provided, defaults to 7."
            ),
            Tool(
                name="get_all_courses_with_assignments",
                func=lambda: self.get_all_courses_with_assignments(),
                description="Get all courses with their assignments in one call. Useful for getting an overview of all courses and assignments."
            ),
            Tool(
                name="get_student_submission",
                func=lambda x: self.get_student_submission(
                    int(x.split(",")[0].strip()),
                    int(x.split(",")[1].strip())
                ),
                description="Get the current user's submission for a specific assignment. Input should be 'course_id, assignment_id' (both integers)."
            ),
            Tool(
                name="get_course_grades",
                func=lambda course_id: self.get_course_grades(int(course_id)),
                description="Get the current user's grades for a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="get_student_submissions_for_course",
                func=lambda course_id: self.get_student_submissions_for_course(int(course_id)),
                description="Get all submissions for the current user in a specific course. Input should be a course ID (integer)."
            ),
            Tool(
                name="analyze_course_performance",
                func=lambda course_id: self.analyze_course_performance(int(course_id)),
                description="Analyze the current user's performance in a specific course. Provides insights into strengths, weaknesses, and overall performance. Input should be a course ID (integer)."
            ),
            Tool(
                name="analyze_assignment_performance",
                func=lambda x: self.analyze_assignment_performance(
                    int(x.split(",")[0].strip()),
                    int(x.split(",")[1].strip())
                ),
                description="Analyze the current user's performance on a specific assignment. Provides detailed insights including comparison with class averages. Input should be 'course_id, assignment_id' (both integers)."
            ),
            Tool(
                name="generate_study_plan",
                func=lambda x: self.generate_study_plan(
                    int(x.split(",")[0].strip()),
                    int(x.split(",")[1].strip()) if len(x.split(",")) > 1 else 14
                ),
                description="Generate a personalized study plan based on past performance and upcoming assignments. Input should be 'course_id, days_ahead' (both integers). If days_ahead is not provided, defaults to 14."
            ),
        ]
